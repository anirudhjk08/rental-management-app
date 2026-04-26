const pool = require('../db/index');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────
// Helper — verify user is part of relation
// ─────────────────────────────────────────
const getRelationAndVerify = async (relationId, userId) => {
  const result = await pool.query(
    `SELECT r.*, s.owner_id 
     FROM relations r
     JOIN shops s ON s.id = r.shop_id
     WHERE r.id = $1 AND r.status = 'active'`,
    [relationId]
  );

  if (result.rows.length === 0) return null;

  const relation = result.rows[0];
  const isParticipant =
    relation.owner_id === userId ||
    relation.tenant_id === userId;

  if (!isParticipant) return null;

  return relation;
};

// ─────────────────────────────────────────
// LOG CASH PAYMENT (Tenant logs it)
// ─────────────────────────────────────────
const logCashPayment = async (req, res) => {
  const { relationId, amount, note, payment_date } = req.body;
  const tenantId = req.user.userId;

  if (!relationId || !amount) {
    return res.status(400).json({ error: 'relationId and amount are required' });
  }

  try {
    const relation = await getRelationAndVerify(relationId, tenantId);

    if (!relation) {
      return res.status(404).json({ error: 'Active relation not found or not authorized' });
    }

    // Only tenant can log cash payment
    if (relation.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Only tenant can log a cash payment' });
    }

    const result = await pool.query(
      `INSERT INTO payments 
        (relation_id, amount, type, status, initiated_by, note, payment_date)
       VALUES ($1, $2, 'cash', 'pending_approval', $3, $4, $5)
       RETURNING *`,
      [relationId, amount, tenantId, note, payment_date || new Date()]
    );

    res.status(201).json({
      message: 'Cash payment logged. Waiting for owner confirmation.',
      payment: result.rows[0],
    });

  } catch (err) {
    console.error('Log cash payment error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// CONFIRM/REJECT CASH PAYMENT (Owner)
// ─────────────────────────────────────────
const respondToCashPayment = async (req, res) => {
  const { paymentId, action } = req.body;
  const ownerId = req.user.userId;

  if (!paymentId || !action) {
    return res.status(400).json({ error: 'paymentId and action are required' });
  }

  if (!['confirm', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be confirm or reject' });
  }

  try {
    // Get payment and verify owner
    const paymentResult = await pool.query(
      `SELECT p.*, s.owner_id
       FROM payments p
       JOIN relations r ON r.id = p.relation_id
       JOIN shops s ON s.id = r.shop_id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Only owner can confirm/reject
    if (payment.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (payment.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Payment is not pending approval' });
    }

    if (payment.type !== 'cash') {
      return res.status(400).json({ error: 'This endpoint is only for cash payments' });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    const result = await pool.query(
      `UPDATE payments
       SET status = $1, confirmed_by = $2
       WHERE id = $3
       RETURNING *`,
      [newStatus, ownerId, paymentId]
    );

    res.status(200).json({
      message: action === 'confirm' ? 'Payment confirmed' : 'Payment rejected',
      payment: result.rows[0],
    });

  } catch (err) {
    console.error('Respond to cash payment error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// CREATE RAZORPAY ORDER (Online payment)
// ─────────────────────────────────────────
const createOnlinePayment = async (req, res) => {
  const { relationId, amount } = req.body;
  const tenantId = req.user.userId;

  if (!relationId || !amount) {
    return res.status(400).json({ error: 'relationId and amount are required' });
  }

  try {
    const relation = await getRelationAndVerify(relationId, tenantId);

    if (!relation) {
      return res.status(404).json({ error: 'Active relation not found or not authorized' });
    }

    if (relation.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Only tenant can initiate online payment' });
    }

    // Create Razorpay order
    // Amount must be in paise (1 INR = 100 paise)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    // Save payment record with initiated status
    const result = await pool.query(
      `INSERT INTO payments
        (relation_id, amount, type, status, initiated_by, gateway_ref_id)
       VALUES ($1, $2, 'online', 'initiated', $3, $4)
       RETURNING *`,
      [relationId, amount, tenantId, order.id]
    );

    res.status(201).json({
      message: 'Order created successfully',
      payment: result.rows[0],
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error('Create online payment error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// VERIFY RAZORPAY PAYMENT (After payment)
// ─────────────────────────────────────────
const verifyOnlinePayment = async (req, res) => {
  const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!paymentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'All payment verification fields are required' });
  }

  try {
    // Verify signature — this proves Razorpay actually processed the payment
    // and the response wasn't tampered with
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Update payment as failed
      await pool.query(
        `UPDATE payments SET status = 'failed' WHERE id = $1`,
        [paymentId]
      );
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // Signature matches — payment is genuine
    const result = await pool.query(
      `UPDATE payments
       SET status = 'success', gateway_ref_id = $1
       WHERE id = $2
       RETURNING *`,
      [razorpay_payment_id, paymentId]
    );

    res.status(200).json({
      message: 'Payment verified successfully',
      payment: result.rows[0],
    });

  } catch (err) {
    console.error('Verify online payment error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET PAYMENT HISTORY (Both owner and tenant)
// ─────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  const { relationId } = req.params;
  const userId = req.user.userId;

  try {
    const relation = await getRelationAndVerify(relationId, userId);

    if (!relation) {
      return res.status(404).json({ error: 'Active relation not found or not authorized' });
    }

    const result = await pool.query(
      `SELECT p.*,
              u1.name as initiated_by_name,
              u2.name as confirmed_by_name
       FROM payments p
       LEFT JOIN users u1 ON u1.id = p.initiated_by
       LEFT JOIN users u2 ON u2.id = p.confirmed_by
       WHERE p.relation_id = $1
       ORDER BY p.payment_date DESC`,
      [relationId]
    );

    res.status(200).json({ payments: result.rows });

  } catch (err) {
    console.error('Get payment history error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  logCashPayment,
  respondToCashPayment,
  createOnlinePayment,
  verifyOnlinePayment,
  getPaymentHistory,
};