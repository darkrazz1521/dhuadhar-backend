const express = require('express');
const router = express.Router();
const {
  getProduction,
  saveProduction,
  markPaid,
} = require('../controllers/production.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getProduction);
router.post('/', authMiddleware, ownerOnly, saveProduction);
router.patch('/:id/pay', authMiddleware, ownerOnly, markPaid);

module.exports = router;
