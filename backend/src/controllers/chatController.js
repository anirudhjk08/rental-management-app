const pool = require('../db/index');

// Get all messages for a relation
const getMessages = async (req, res) => {
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

    // Get messages
    const result = await pool.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.relation_id = $1
       ORDER BY m.created_at ASC`,
      [relationId]
    );

    res.status(200).json({ messages: result.rows });

  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getMessages };