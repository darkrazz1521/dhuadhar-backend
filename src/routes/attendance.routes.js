const express = require('express');
const router = express.Router();
const {
  getDailyAttendance,
  saveAttendance,
} = require('../controllers/attendance.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/', authMiddleware, ownerOnly, getDailyAttendance);
router.post('/', authMiddleware, ownerOnly, saveAttendance);

module.exports = router;
