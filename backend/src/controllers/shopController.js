const pool = require('../db/index');
const { createNotification } = require('../utils/notificationHelper');

// ─────────────────────────────────────────
// Generate unique shop code
// ─────────────────────────────────────────
const generateShopCode = async (shopName) => {
  const prefix = shopName.replace(/\s/g, '').substring(0, 4).toUpperCase();
  let code;
  let isUnique = false;

  while (!isUnique) {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}_${random}`;
    const existing = await pool.query(
      'SELECT id FROM shops WHERE unique_code = $1',
      [code]
    );
    if (existing.rows.length === 0) isUnique = true;
  }

  return code;
};

// ─────────────────────────────────────────
// CREATE SHOP
// ─────────────────────────────────────────
const createShop = async (req, res) => {
  const { name, address, monthly_rent } = req.body;
  const ownerId = req.user.userId;

  if (!name || !monthly_rent) {
    return res.status(400).json({ error: 'Name and monthly_rent are required' });
  }

  try {
    const uniqueCode = await generateShopCode(name);

    const result = await pool.query(
      `INSERT INTO shops (owner_id, unique_code, name, address, monthly_rent)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ownerId, uniqueCode, name, address, monthly_rent]
    );

    res.status(201).json({
      message: 'Shop created successfully',
      shop: result.rows[0],
    });

  } catch (err) {
    console.error('Create shop error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET MY SHOPS (Owner)
// ─────────────────────────────────────────
const getMyShops = async (req, res) => {
  const ownerId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT s.*, 
        u.name as tenant_name, 
        u.email as tenant_email,
        r.status as relation_status,
        r.id as relation_id
       FROM shops s
       LEFT JOIN relations r ON r.shop_id = s.id AND r.status = 'active'
       LEFT JOIN users u ON u.id = r.tenant_id
       WHERE s.owner_id = $1
       ORDER BY s.created_at DESC`,
      [ownerId]
    );

    res.status(200).json({ shops: result.rows });

  } catch (err) {
    console.error('Get my shops error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET JOINED SHOPS (Tenant)
// ─────────────────────────────────────────
const getJoinedShops = async (req, res) => {
  const tenantId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT s.*, 
              u.name as owner_name,
              r.status as relation_status,
              r.id as relation_id
       FROM relations r
       JOIN shops s ON s.id = r.shop_id
       JOIN users u ON u.id = s.owner_id
       WHERE r.tenant_id = $1 AND r.status = 'active'
       ORDER BY r.started_at DESC`,
      [tenantId]
    );

    res.status(200).json({ shops: result.rows });

  } catch (err) {
    console.error('Get joined shops error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// SEARCH SHOP BY CODE
// ─────────────────────────────────────────
const searchShop = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Shop code is required' });
  }

  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.address, s.monthly_rent, s.unique_code,
              u.name as owner_name
       FROM shops s
       JOIN users u ON u.id = s.owner_id
       WHERE s.unique_code = $1`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found. Check the code and try again.' });
    }

    res.status(200).json({ shop: result.rows[0] });

  } catch (err) {
    console.error('Search shop error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// JOIN SHOP (Tenant)
// ─────────────────────────────────────────
const joinShop = async (req, res) => {
  const { shopId } = req.body;
  const tenantId = req.user.userId;

  if (!shopId) {
    return res.status(400).json({ error: 'shopId is required' });
  }

  try {
    const shopResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1',
      [shopId]
    );

    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const shop = shopResult.rows[0];

    if (shop.owner_id === tenantId) {
      return res.status(400).json({ error: 'You cannot join your own shop' });
    }

    const activeRelation = await pool.query(
      `SELECT id FROM relations WHERE shop_id = $1 AND status = 'active'`,
      [shopId]
    );

    if (activeRelation.rows.length > 0) {
      return res.status(400).json({ error: 'Shop already has an active tenant' });
    }

    const pendingRelation = await pool.query(
      `SELECT id FROM relations WHERE shop_id = $1 AND tenant_id = $2 AND status = 'pending'`,
      [shopId, tenantId]
    );

    if (pendingRelation.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending request for this shop' });
    }

    const result = await pool.query(
      `INSERT INTO relations (shop_id, tenant_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [shopId, tenantId]
    );

    // Notify owner
    const ownerResult = await pool.query(
      `SELECT u.email, u.name, u.id as owner_id
       FROM users u
       JOIN shops s ON s.owner_id = u.id
       WHERE s.id = $1`,
      [shopId]
    );
    const owner = ownerResult.rows[0];

    await createNotification({
      userId: owner.owner_id,
      type: 'join_request',
      userEmail: owner.email,
      emailSubject: 'New join request for your shop!',
      emailBody: `
        <h2>Hello ${owner.name}!</h2>
        <p>A tenant has requested to join your shop.</p>
        <p>Login to your dashboard to accept or reject the request.</p>
      `,
    });

    res.status(201).json({
      message: 'Join request sent successfully. Waiting for owner approval.',
      relation: result.rows[0],
    });

  } catch (err) {
    console.error('Join shop error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// RESPOND TO JOIN REQUEST (Owner)
// ─────────────────────────────────────────
const respondToJoinRequest = async (req, res) => {
  const { relationId, action } = req.body;
  const ownerId = req.user.userId;

  if (!relationId || !action) {
    return res.status(400).json({ error: 'relationId and action are required' });
  }

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accept or reject' });
  }

  try {
    const relationResult = await pool.query(
      `SELECT r.*, s.owner_id 
       FROM relations r
       JOIN shops s ON s.id = r.shop_id
       WHERE r.id = $1`,
      [relationId]
    );

    if (relationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Relation not found' });
    }

    const relation = relationResult.rows[0];

    if (relation.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }

    if (relation.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been responded to' });
    }

    const newStatus = action === 'accept' ? 'active' : 'ended';
    const startedAt = action === 'accept' ? new Date() : null;

    const result = await pool.query(
      `UPDATE relations SET status = $1, started_at = $2 WHERE id = $3 RETURNING *`,
      [newStatus, startedAt, relationId]
    );

    if (action === 'accept') {
      const tenantResult = await pool.query(
        'SELECT email, name FROM users WHERE id = $1',
        [relation.tenant_id]
      );
      const tenant = tenantResult.rows[0];

      await createNotification({
        userId: relation.tenant_id,
        type: 'join_request',
        userEmail: tenant.email,
        emailSubject: 'Your join request was accepted!',
        emailBody: `
          <h2>Great news, ${tenant.name}!</h2>
          <p>Your request to join the shop has been <strong>accepted</strong>.</p>
          <p>You can now start communicating with your owner and managing payments.</p>
        `,
      });
    }

    res.status(200).json({
      message: action === 'accept' ? 'Tenant accepted successfully' : 'Request rejected',
      relation: result.rows[0],
    });

  } catch (err) {
    console.error('Respond to join request error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET PENDING REQUESTS (Owner)
// ─────────────────────────────────────────
const getPendingRequests = async (req, res) => {
  const ownerId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT r.id, r.status, r.created_at,
              u.name as tenant_name, u.email as tenant_email,
              s.name as shop_name, s.unique_code
       FROM relations r
       JOIN users u ON u.id = r.tenant_id
       JOIN shops s ON s.id = r.shop_id
       WHERE s.owner_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [ownerId]
    );

    res.status(200).json({ requests: result.rows });

  } catch (err) {
    console.error('Get pending requests error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// DELETE SHOP (Owner)
// ─────────────────────────────────────────
const deleteShop = async (req, res) => {
  const { shopId } = req.params;
  const ownerId = req.user.userId;

  try {
    const shopResult = await pool.query(
      'SELECT * FROM shops WHERE id = $1 AND owner_id = $2',
      [shopId, ownerId]
    );

    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found or not authorized' });
    }

    await pool.query('DELETE FROM shops WHERE id = $1', [shopId]);

    res.status(200).json({ message: 'Shop deleted successfully' });

  } catch (err) {
    console.error('Delete shop error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createShop,
  getMyShops,
  getJoinedShops,
  searchShop,
  joinShop,
  respondToJoinRequest,
  getPendingRequests,
  deleteShop,
};