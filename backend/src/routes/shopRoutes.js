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
  getJoinedShops,
  deleteShop,
} = require('../controllers/shopController');

router.post('/create', protect, createShop);
router.get('/my-shops', protect, getMyShops);
router.get('/search', protect, searchShop);
router.post('/join', protect, joinShop);
router.post('/respond', protect, respondToJoinRequest);
router.get('/pending-requests', protect, getPendingRequests);
router.get('/joined-shops', protect, getJoinedShops);
router.delete('/:shopId', protect, deleteShop);

module.exports = router;