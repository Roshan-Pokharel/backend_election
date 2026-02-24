// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Admin (Locked to 1 user max)
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if ANY user already exists to enforce the single-admin rule
    const adminExists = await User.countDocuments();
    
    if (adminExists > 0) {
      return res.status(403).json({ 
        message: "Registration locked. An administrator already exists for this portal." 
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 3. Create and save the new admin
    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: true
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin account created successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    // 4. Send response
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { registerAdmin, loginAdmin };