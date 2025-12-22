const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
} = require('../controllers/dashboard.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get(
  '/summary',
  authMiddleware,
  ownerOnly,
  getDashboardSummary
);

module.exports = router;
