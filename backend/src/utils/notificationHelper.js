const pool = require('../db/index');
const { sendNotificationEmail } = require('./emailService');

// ─────────────────────────────────────────
// Core helper — saves to DB + sends email
// ─────────────────────────────────────────
const createNotification = async ({
  userId,
  type,
  message_id = null,
  payment_id = null,
  rent_proposal_id = null,
  emailSubject,
  emailBody,
  userEmail,
}) => {
  try {
    // Save to notifications table (in-app)
    await pool.query(
      `INSERT INTO notifications
        (user_id, type, message_id, payment_id, rent_proposal_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, message_id, payment_id, rent_proposal_id]
    );

    // Send email notification
    if (userEmail && emailSubject && emailBody) {
      await sendNotificationEmail(userEmail, emailSubject, emailBody);
    }

  } catch (err) {
    // Notifications should never crash the main flow
    // So we just log the error instead of throwing
    console.error('Create notification error:', err.message);
  }
};

module.exports = { createNotification };