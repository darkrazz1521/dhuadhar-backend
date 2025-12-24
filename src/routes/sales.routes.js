const express = require('express');
const router = express.Router();

const {
  createSale,
  getTodaySales,
  getSalesByCustomer,
  getSaleDetail,
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

// GET SALES BY CUSTOMER
router.get(
  '/customer/:customerId',
  authMiddleware,
  getSalesByCustomer
);

// GET SALE FULL DETAIL
router.get(
  '/:saleId/detail',
  authMiddleware,
  getSaleDetail
);

module.exports = router;
