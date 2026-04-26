const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  logCashPayment,
  respondToCashPayment,
  createOnlinePayment,
  verifyOnlinePayment,
  getPaymentHistory,
} = require('../controllers/paymentController');

router.post('/cash/log', protect, logCashPayment);
router.post('/cash/respond', protect, respondToCashPayment);
router.post('/online/create', protect, createOnlinePayment);
router.post('/online/verify', protect, verifyOnlinePayment);
router.get('/:relationId/history', protect, getPaymentHistory);

module.exports = router;