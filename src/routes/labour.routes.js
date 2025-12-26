const express = require('express');
const router = express.Router();

const {
  getLabours,
  createLabour,
  toggleLabourStatus,
  getDrivers, // ✅ ADD THIS
} = require('../controllers/labour.controller');

const { authMiddleware, ownerOnly } = require('../middleware/auth');

// 🔥 IMPORTANT: Specific routes FIRST
router.get('/drivers', authMiddleware, ownerOnly, getDrivers);

// Existing routes
router.get('/', authMiddleware, ownerOnly, getLabours);
router.post('/', authMiddleware, ownerOnly, createLabour);
router.patch('/:id/toggle', authMiddleware, ownerOnly, toggleLabourStatus);

module.exports = router;
