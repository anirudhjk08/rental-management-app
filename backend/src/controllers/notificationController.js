const pool = require('../db/index');

// ─────────────────────────────────────────
// GET ALL NOTIFICATIONS for logged in user
// ─────────────────────────────────────────
const getNotifications = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT n.*,
              m.content as message_content,
              p.amount as payment_amount,
              p.type as payment_type,
              rp.new_rent as proposed_rent
       FROM notifications n
       LEFT JOIN messages m ON m.id = n.message_id
       LEFT JOIN payments p ON p.id = n.payment_id
       LEFT JOIN rent_proposals rp ON rp.id = n.rent_proposal_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    // Count unread notifications
    const unreadCount = result.rows.filter(n => !n.is_read).length;

    res.status(200).json({
      notifications: result.rows,
      unread_count: unreadCount,
    });

  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────
const markAllRead = async (req, res) => {
  const userId = req.user.userId;

  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [userId]
    );

    res.status(200).json({ message: 'All notifications marked as read' });

  } catch (err) {
    console.error('Mark all read error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// MARK ONE AS READ
// ─────────────────────────────────────────
const markOneRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.userId;

  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    res.status(200).json({ message: 'Notification marked as read' });

  } catch (err) {
    console.error('Mark one read error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getNotifications, markAllRead, markOneRead };