const express = require('express');
const router = express.Router();
const {
  getDailyProduction,
  saveProduction,
  markPaid,
} = require('../controllers/production.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

// ✅ GET /api/production/daily/2025-01-01?category=production
router.get('/daily/:date', authMiddleware, ownerOnly, getDailyProduction);

// ✅ POST /api/production/daily/2025-01-01
router.post('/daily/:date', authMiddleware, ownerOnly, saveProduction);

// OPTIONAL: Keep existing patch route
router.patch('/:id/pay', authMiddleware, ownerOnly, markPaid);

module.exports = router;