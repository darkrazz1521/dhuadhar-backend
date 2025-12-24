const express = require('express');
const router = express.Router();
const {
  searchCustomers,
  createCustomer,
} = require('../controllers/customer.controller');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, searchCustomers);
router.post('/', authMiddleware, createCustomer);
router.get('/', authMiddleware, getCustomers);

module.exports = router;
