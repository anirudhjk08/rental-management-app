const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createShop,
  getMyShops,
  searchShop,
  joinShop,
  respondToJoinRequest,
  getPendingRequests,
} = require('../controllers/shopController');

router.post('/create', protect, createShop);
router.get('/my-shops', protect, getMyShops);
router.get('/search', protect, searchShop);
router.post('/join', protect, joinShop);
router.post('/respond', protect, respondToJoinRequest);
router.get('/pending-requests', protect, getPendingRequests);

module.exports = router;