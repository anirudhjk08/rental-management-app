const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMessages } = require('../controllers/chatController');

router.get('/:relationId/messages', protect, getMessages);

module.exports = router;