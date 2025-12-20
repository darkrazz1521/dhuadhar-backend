const express = require('express');
const router = express.Router();
const {
  setPrice,
  getPrices,
} = require('../controllers/price.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, getPrices);
router.post('/', authMiddleware, ownerOnly, setPrice);

module.exports = router;
