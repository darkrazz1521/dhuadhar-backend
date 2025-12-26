const express = require('express');
const router = express.Router();

const {
  createAdvance,
  getAdvances,
  getAdvanceDetail,
  convertToSale,
  partialDeliver, // ✅ Correct Import
} = require('../controllers/advance.controller');

const {
  authMiddleware,
  ownerOnly,
} = require('../middleware/auth');

// ------------------------------------
// Create advance order
// ------------------------------------
router.post('/', authMiddleware, createAdvance);

// ------------------------------------
// Get all advance orders
// ------------------------------------
router.get('/', authMiddleware, getAdvances);

// ------------------------------------
// Get single advance detail
// ------------------------------------
// Note: If your app calls "$baseUrl/advances/$id", use '/:id'
// If it calls "$baseUrl/advances/$id/detail", use '/:id/detail'
// Standard REST is usually just /:id:
router.get('/:id', authMiddleware, getAdvanceDetail); 

// ------------------------------------
// Full delivery → convert advance to sale
// ------------------------------------
router.post(
  '/:id/convert',
  authMiddleware,
  ownerOnly,
  convertToSale
);

// ------------------------------------
// Partial delivery (MATCHES FLUTTER APP)
// ------------------------------------
// 🔥 Fixed: Changed 'partial-deliver' to 'deliver' to match Flutter service
router.post(
  '/:id/deliver', 
  authMiddleware,
  ownerOnly,
  partialDeliver
);

module.exports = router;