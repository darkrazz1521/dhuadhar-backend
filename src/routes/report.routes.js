const express = require('express');
const router = express.Router();
const {
  getSummary,
  getSalesReport, // ✅ FIX
} = require('../controllers/report.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/summary', authMiddleware, ownerOnly, getSummary);
router.get('/sales', authMiddleware, getSalesReport);

module.exports = router;
