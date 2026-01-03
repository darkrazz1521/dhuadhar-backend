const express = require('express');
const router = express.Router();

const { getLabourProfile } =
  require('../controllers/labour.controller'); // SAME controller you already wrote

const { authMiddleware, ownerOnly } =
  require('../middleware/auth');

// GET /api/labour/:id/profile
router.get(
  '/labour/:id/profile',
  authMiddleware,
  ownerOnly,
  getLabourProfile
);

module.exports = router;
