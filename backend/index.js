require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import User model
const User = require('./models/user.model');

// Import configuration
const config = require('./config.json');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Connect to MongoDB
mongoose.connect(config.connectionString)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Create Account Route
app.post('/create-account', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: true, message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: true, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword
    });

    // Save user to database
    await newUser.save();

    // Generate JWT
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '72h' }
    );

    // Send success response
    return res.status(201).json({
      error: false,
      user: { fullName: newUser.fullName, email: newUser.email },
      accessToken,
      message: 'Registration Successful',
    });

  } catch (error) {
    console.error('Error in create-account:', error);
    return res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

//30.00mins