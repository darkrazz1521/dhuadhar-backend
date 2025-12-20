const express = require('express');
const router = express.Router();

const {
  createAdvance,
  getAdvances,
  convertToSale,
  partialDeliver, // ✅ NEW
} = require('../controllers/advance.controller');

const {
  authMiddleware,
  ownerOnly,
} = require('../middleware/auth');

// ------------------------------------
// Create advance order (STAFF + OWNER)
// ------------------------------------
router.post('/', authMiddleware, createAdvance);

// ------------------------------------
// Get all advance orders (STAFF + OWNER)
// ------------------------------------
router.get('/', authMiddleware, getAdvances);

// ------------------------------------
// Full delivery → convert advance to sale (OWNER ONLY)
// ------------------------------------
router.post(
  '/:id/convert',
  authMiddleware,
  ownerOnly,
  convertToSale
);

// ------------------------------------
// Partial delivery (OWNER ONLY) ✅
// ------------------------------------
router.post(
  '/:id/partial-deliver',
  authMiddleware,
  ownerOnly,
  partialDeliver
);

module.exports = router;
