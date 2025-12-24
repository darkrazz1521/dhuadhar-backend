const express = require('express');
const router = express.Router();

const {
  getCredits,
  getCreditByCustomer,
  clearCredit,
  getCreditPayments, // ✅ NEW
} = require('../controllers/credit.controller');

const {
  getCustomerCreditSummary,
} = require('../controllers/credit.controller');
const {
  authMiddleware,
  ownerOnly,
} = require('../middleware/auth');

// ------------------------------------
// Get all credits (OWNER + STAFF)
// ------------------------------------
router.get('/', authMiddleware, getCredits);

// ------------------------------------
// Get single customer credit
// ------------------------------------
router.get('/:customerId', authMiddleware, getCreditByCustomer);

// ------------------------------------
// Get credit payment history (OWNER + STAFF)
// ------------------------------------
router.get(
  '/:customerId/payments',
  authMiddleware,
  getCreditPayments
);

// ------------------------------------
// Clear / adjust credit (OWNER ONLY)
// ------------------------------------
router.post(
  '/clear',
  authMiddleware,
  ownerOnly,
  clearCredit
);

router.get(
  '/customer/:customerId/summary',
  authMiddleware,
  getCustomerCreditSummary
);

module.exports = router;
