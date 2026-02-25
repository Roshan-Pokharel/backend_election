const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCandidates,
  getCandidateById,
  interactCandidate, 
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');

// Public Routes
router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/:id/interact', interactCandidate);

// Protected Routes (Require Authentication)
// Removed multer upload middleware completely
router.post('/', protect, createCandidate);
router.put('/:id', protect, updateCandidate);
router.delete('/:id', protect, deleteCandidate);

module.exports = router;