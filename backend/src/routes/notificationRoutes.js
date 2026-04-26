const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAllRead,
  markOneRead,
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllRead);
router.put('/:notificationId/read', protect, markOneRead);

module.exports = router;