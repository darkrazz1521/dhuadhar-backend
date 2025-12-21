const express = require('express');
const router = express.Router();

const {
  createSale,
  getTodaySales,
} = require('../controllers/sales.controller');

const { authMiddleware } = require('../middleware/auth');

// CREATE SALE
router.post(
  '/',
  authMiddleware,
  createSale
);

// GET TODAY SALES
router.get(
  '/today',
  authMiddleware,
  getTodaySales
);

module.exports = router;
