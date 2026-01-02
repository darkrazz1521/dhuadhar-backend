const express = require('express');
const router = express.Router();
const {
  addAdvance,
  getAdvances,
  calculateDues,
  createPayment,
} = require('../controllers/finance.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

// Advances
router.post('/advance', authMiddleware, ownerOnly, addAdvance);
router.get('/advance', authMiddleware, ownerOnly, getAdvances);

// Salary Calculation & Payment
router.get('/salary/calculate', authMiddleware, ownerOnly, calculateDues);
router.post('/salary/pay', authMiddleware, ownerOnly, createPayment);

module.exports = router;