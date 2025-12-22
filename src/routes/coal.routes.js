const express = require('express');
const router = express.Router();
const {
  getCoalExpenses,
  createCoalExpense,
} = require('../controllers/coal.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getCoalExpenses);
router.post('/', authMiddleware, ownerOnly, createCoalExpense);

module.exports = router;
