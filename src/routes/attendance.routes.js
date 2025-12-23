const express = require('express');
const router = express.Router();
const {
  getDailyAttendance,
  saveAttendance,
} = require('../controllers/attendance.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/daily/:date', authMiddleware, ownerOnly, getDailyAttendance);
router.post('/daily/:date', authMiddleware, ownerOnly, saveAttendance);


module.exports = router;
