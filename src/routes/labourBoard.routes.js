const express = require('express');
const router = express.Router();
const {
  getLabourBoard,
} = require('../controllers/labourBoard.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getLabourBoard);

module.exports = router;
