const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  party: { type: String, required: true },
  constituency: { type: String, required: true },
  education: { type: String, required: true },
  biography: { type: String, required: true },
  politicalHistory: { type: String },
  achievements: { type: String },
  imageUrl: { type: String },
  
  // --- NEW FIELDS ---
  allegations: { type: String, default: 'No known allegations.' },
  criminalRecord: { type: String, default: 'No known criminal record.' },
  youtubeUrl: { type: String }, 
  
  // Track IP addresses to ensure one action per user
  viewedBy: [{ type: String }],
  likedBy: [{ type: String }],
  dislikedBy: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);