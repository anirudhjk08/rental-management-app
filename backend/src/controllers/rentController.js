const { createNotification } = require('../utils/notificationHelper');
const pool = require('../db/index');

// ─────────────────────────────────────────
// PROPOSE RENT INCREASE (Owner only)
// ─────────────────────────────────────────
const proposeRentIncrease = async (req, res) => {
  const { relationId, new_rent, effective_date } = req.body;
  const ownerId = req.user.userId;

  if (!relationId || !new_rent || !effective_date) {
    return res.status(400).json({ error: 'relationId, new_rent and effective_date are required' });
  }

  try {
    // Get relation and verify owner
    const relationResult = await pool.query(
      `SELECT r.*, s.owner_id, s.monthly_rent
       FROM relations r
       JOIN shops s ON s.id = r.shop_id
       WHERE r.id = $1 AND r.status = 'active'`,
      [relationId]
    );

    if (relationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Active relation not found' });
    }

    const relation = relationResult.rows[0];

    // Only owner can propose rent increase
    if (relation.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Only the shop owner can propose a rent increase' });
    }

    // Check if there is already a pending proposal for this relation
    const existingProposal = await pool.query(
      `SELECT id FROM rent_proposals
       WHERE relation_id = $1 AND status = 'pending'`,
      [relationId]
    );

    if (existingProposal.rows.length > 0) {
      return res.status(400).json({ error: 'There is already a pending rent proposal for this relation' });
    }

    // Create the proposal
    const result = await pool.query(
      `INSERT INTO rent_proposals
        (relation_id, proposed_by, old_rent, new_rent, effective_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [relationId, ownerId, relation.monthly_rent, new_rent, effective_date]
    );
    const tenantResult = await pool.query(
      'SELECT email, name FROM users WHERE id = $1',
      [relation.tenant_id]
    );
    const tenant = tenantResult.rows[0];

    await createNotification({
      userId: relation.tenant_id,
      type: 'rent_proposal',
      rent_proposal_id: result.rows[0].id,
      userEmail: tenant.email,
      emailSubject: 'New rent increase proposal',
      emailBody: `
    <h2>Hello ${tenant.name}!</h2>
    <p>Your owner has proposed a rent increase.</p>
    <p>Current rent: <strong>₹${relation.monthly_rent}</strong></p>
    <p>Proposed rent: <strong>₹${new_rent}</strong></p>
    <p>Effective date: <strong>${effective_date}</strong></p>
    <p>Please login to accept or reject this proposal.</p>
  `,
    });
    res.status(201).json({
      message: 'Rent increase proposed successfully. Waiting for tenant approval.',
      proposal: result.rows[0],
    });

  } catch (err) {
    console.error('Propose rent increase error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// RESPOND TO PROPOSAL (Tenant only)
// ─────────────────────────────────────────
const respondToProposal = async (req, res) => {
  const { proposalId, action } = req.body;
  const tenantId = req.user.userId;

  if (!proposalId || !action) {
    return res.status(400).json({ error: 'proposalId and action are required' });
  }

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accept or reject' });
  }

  try {
    // Get proposal and verify tenant
    const proposalResult = await pool.query(
      `SELECT rp.*, r.tenant_id, r.shop_id
       FROM rent_proposals rp
       JOIN relations r ON r.id = rp.relation_id
       WHERE rp.id = $1`,
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposalResult.rows[0];

    // Only tenant of that relation can respond
    if (proposal.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Only the tenant can respond to this proposal' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ error: 'This proposal has already been responded to' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update proposal status
    const result = await pool.query(
      `UPDATE rent_proposals
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [newStatus, proposalId]
    );

    // If accepted → update shop's monthly rent automatically
    if (action === 'accept') {
      await pool.query(
        `UPDATE shops
         SET monthly_rent = $1
         WHERE id = $2`,
        [proposal.new_rent, proposal.shop_id]
      );
    }
    const ownerResult = await pool.query(
      `SELECT u.email, u.name, u.id as owner_id
   FROM users u
   JOIN shops s ON s.owner_id = u.id
   JOIN relations r ON r.shop_id = s.id
   WHERE r.id = $1`,
      [proposal.relation_id]
    );

    if (ownerResult.rows.length > 0) {
      const owner = ownerResult.rows[0];
      await createNotification({
        userId: owner.owner_id,
        type: 'rent_proposal',
        rent_proposal_id: proposalId,
        userEmail: owner.email,
        emailSubject: action === 'accept'
          ? 'Tenant accepted rent increase!'
          : 'Tenant rejected rent increase',
        emailBody: `
      <h2>Hello ${owner.name}!</h2>
      <p>Your tenant has <strong>${action === 'accept' ? 'accepted' : 'rejected'}</strong>
         the rent increase proposal.</p>
      ${action === 'accept'
            ? `<p>The new rent of <strong>₹${proposal.new_rent}</strong>
             is now active from ${proposal.effective_date}.</p>`
            : ''}
    `,
      });
    }
    res.status(200).json({
      message: action === 'accept'
        ? `Rent increase accepted. New rent is ₹${proposal.new_rent} effective ${proposal.effective_date}`
        : 'Rent increase rejected.',
      proposal: result.rows[0],
    });

  } catch (err) {
    console.error('Respond to proposal error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET ALL PROPOSALS FOR A RELATION
// ─────────────────────────────────────────
const getProposals = async (req, res) => {
  const { relationId } = req.params;
  const userId = req.user.userId;

  try {
    // Verify user is part of this relation
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
    const isParticipant =
      relation.owner_id === userId ||
      relation.tenant_id === userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `SELECT rp.*, u.name as proposed_by_name
       FROM rent_proposals rp
       JOIN users u ON u.id = rp.proposed_by
       WHERE rp.relation_id = $1
       ORDER BY rp.created_at DESC`,
      [relationId]
    );

    res.status(200).json({ proposals: result.rows });

  } catch (err) {
    console.error('Get proposals error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  proposeRentIncrease,
  respondToProposal,
  getProposals,
};