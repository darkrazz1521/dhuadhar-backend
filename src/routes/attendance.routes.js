const express = require('express');
const router = express.Router();
const {
  getDailyAttendance,
  saveAttendance,
} = require('../controllers/attendance.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

// GET /api/attendance/daily/2025-01-01
router.get('/daily/:date', authMiddleware, ownerOnly, getDailyAttendance);

// POST /api/attendance/daily/2025-01-01
router.post('/daily/:date', authMiddleware, ownerOnly, saveAttendance);

module.exports = router;