const express = require('express');
const router = express.Router();

const {
  createAdvance,
  getAdvances,
  getAdvanceDetail, // ✅ ADD THIS
  convertToSale,
  partialDeliver,
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
// Get single advance detail + linked sales ✅ STEP-2.1
// ------------------------------------
router.get(
  '/:id/detail',
  authMiddleware,
  getAdvanceDetail
);

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
// Partial delivery (OWNER ONLY)
// ------------------------------------
router.post(
  '/:id/partial-deliver',
  authMiddleware,
  ownerOnly,
  partialDeliver
);

module.exports = router;
