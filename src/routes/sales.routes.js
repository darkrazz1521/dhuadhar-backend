const express = require('express');
const router = express.Router();

const salesController = require('../controllers/sales.controller');

// CREATE SALE
router.post('/create', salesController.createSale);

// GET TODAY SALES
router.get('/today', salesController.getTodaySales);

module.exports = router;
