const express = require('express');
const router = express.Router();
const {
  getLandExpenses,
  createLandExpense,
} = require('../controllers/land.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getLandExpenses);
router.post('/', authMiddleware, ownerOnly, createLandExpense);

module.exports = router;
