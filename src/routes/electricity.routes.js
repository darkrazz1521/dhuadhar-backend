const express = require('express');
const router = express.Router();
const {
  getElectricityExpenses,
  createElectricityExpense,
} = require('../controllers/electricity.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getElectricityExpenses);
router.post('/', authMiddleware, ownerOnly, createElectricityExpense);

module.exports = router;
