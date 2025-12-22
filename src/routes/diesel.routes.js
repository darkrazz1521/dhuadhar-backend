const express = require('express');
const router = express.Router();
const {
  getDieselExpenses,
  createDieselExpense,
} = require('../controllers/diesel.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getDieselExpenses);
router.post('/', authMiddleware, ownerOnly, createDieselExpense);

module.exports = router;
