const express = require('express');
const router = express.Router();
const {
  getDailyProduction,
  saveProduction,
  markPaid,
} = require('../controllers/production.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

// GET /api/production/daily/:date?workType=Loader
router.get('/daily/:date', authMiddleware, ownerOnly, getDailyProduction);

// POST /api/production/daily/:date?workType=Loader
router.post('/daily/:date', authMiddleware, ownerOnly, saveProduction);

// Optional Patch
router.patch('/:id/pay', authMiddleware, ownerOnly, markPaid);

module.exports = router;