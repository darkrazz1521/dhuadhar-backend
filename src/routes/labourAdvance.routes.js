const express = require('express');
const router = express.Router();
const {
  addAdvance,
  getAdvances,
  deleteAdvance,
} = require('../controllers/labourAdvance.controller');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

// POST /api/labour-advance
router.post('/', authMiddleware, ownerOnly, addAdvance);

// GET /api/labour-advance?labourId=...
router.get('/', authMiddleware, ownerOnly, getAdvances);

// DELETE /api/labour-advance/:id
router.delete('/:id', authMiddleware, ownerOnly, deleteAdvance);

module.exports = router;