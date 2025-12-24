const express = require('express');
const router = express.Router();

const {
  getCustomers,
  searchCustomers,
  createCustomer,
} = require('../controllers/customer.controller');

const { authMiddleware } = require('../middleware/auth');

// GET ALL CUSTOMERS
router.get('/', authMiddleware, getCustomers);

// SEARCH CUSTOMERS
router.get('/search', authMiddleware, searchCustomers);

// CREATE CUSTOMER
router.post('/', authMiddleware, createCustomer);

module.exports = router;
