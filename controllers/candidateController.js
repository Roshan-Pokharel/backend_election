const Candidate = require('../models/Candidate');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.aggregate([
      {
        // Add temporary fields to hold the array lengths
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likedBy', []] } },
          dislikesCount: { $size: { $ifNull: ['$dislikedBy', []] } },
          viewsCount: { $size: { $ifNull: ['$viewedBy', []] } }
        }
      },
      {
        // Sort by likesCount descending (largest to smallest)
        // Secondary sort by createdAt descending (newest first for ties)
        $sort: { likesCount: -1, createdAt: -1 }
      }
    ]);

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get a single candidate by ID (Handles Views)
// @route   GET /api/candidates/:id
// @access  Public
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Get the user's IP Address
    // Note: If you deploy to Heroku/Vercel/Render, use req.headers['x-forwarded-for']
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // If this IP hasn't viewed the profile yet, add it to the array
    if (!candidate.viewedBy.includes(userIp)) {
      candidate.viewedBy.push(userIp);
      await candidate.save();
    }

    // Send the candidate data, plus calculated counts and user status
    res.json({
      ...candidate.toObject(),
      viewsCount: candidate.viewedBy.length,
      likesCount: candidate.likedBy.length,
      dislikesCount: candidate.dislikedBy.length,
      userHasLiked: candidate.likedBy.includes(userIp),
      userHasDisliked: candidate.dislikedBy.includes(userIp)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; // Fixed syntax error here

// @desc    Toggle Like/Dislike
// @route   POST /api/candidates/:id/interact
// @access  Public
const interactCandidate = async (req, res) => {
  try {
    const { action } = req.body; // Expects 'like' or 'dislike'
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    if (action === 'like') {
      // If already liked, remove the like (toggle off)
      if (candidate.likedBy.includes(userIp)) {
        candidate.likedBy = candidate.likedBy.filter(ip => ip !== userIp);
      } else {
        // Add like, and remove from dislikes if they had previously disliked
        candidate.likedBy.push(userIp);
        candidate.dislikedBy = candidate.dislikedBy.filter(ip => ip !== userIp);
      }
    } else if (action === 'dislike') {
      // If already disliked, remove the dislike (toggle off)
      if (candidate.dislikedBy.includes(userIp)) {
        candidate.dislikedBy = candidate.dislikedBy.filter(ip => ip !== userIp);
      } else {
        // Add dislike, and remove from likes if they had previously liked
        candidate.dislikedBy.push(userIp);
        candidate.likedBy = candidate.likedBy.filter(ip => ip !== userIp);
      }
    }

    await candidate.save();

    res.json({
      likesCount: candidate.likedBy.length,
      dislikesCount: candidate.dislikedBy.length,
      userHasLiked: candidate.likedBy.includes(userIp),
      userHasDisliked: candidate.dislikedBy.includes(userIp)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new candidate
// @route   POST /api/candidates
// @access  Private (Admin)
const createCandidate = async (req, res) => {
  try {
    const newCandidate = new Candidate({
      ...req.body,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    const savedCandidate = await newCandidate.save();
    res.status(201).json(savedCandidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin)
const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Copy text fields from the request body
    const updateData = { ...req.body };
    
    // If a new image was uploaded, update the imageUrl field
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true } // Return the updated document & run schema validations
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json(updatedCandidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Admin)
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCandidates,
  getCandidateById,
  interactCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate
};