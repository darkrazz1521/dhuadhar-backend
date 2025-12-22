const express = require('express');
const router = express.Router();
const {
  getSalaryLabours,
  paySalary,
} = require('../controllers/payment.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/salary', authMiddleware, ownerOnly, getSalaryLabours);
router.post('/salary/pay', authMiddleware, ownerOnly, paySalary);

module.exports = router;
