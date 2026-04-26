const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  proposeRentIncrease,
  respondToProposal,
  getProposals,
} = require('../controllers/rentController');

router.post('/propose', protect, proposeRentIncrease);
router.post('/respond', protect, respondToProposal);
router.get('/:relationId/proposals', protect, getProposals);

module.exports = router;