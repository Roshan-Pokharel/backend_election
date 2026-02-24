const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getCandidates,
  getCandidateById,
  interactCandidate, // <-- Added the new interact function here
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');

// Public Routes
router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/:id/interact', interactCandidate); // <-- Linked the route to the controller

// Protected Routes (Require Authentication)
// Add upload.single('image') to both POST and PUT to handle file uploads
router.post('/', protect, upload.single('image'), createCandidate);
router.put('/:id', protect, upload.single('image'), updateCandidate);
router.delete('/:id', protect, deleteCandidate);

module.exports = router;