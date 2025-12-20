const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/report.controller');
const { authMiddleware } = require('../middleware/auth');

router.get('/summary', authMiddleware, getSummary);

module.exports = router;
