require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const upload = require("./multer");
const fs = require("fs");
const path = require("path");

const { authenticateToken } = require("./utilities");

// Import User model
const User = require('./models/user.model');
const TravelStory = require('./models/travelStory.model');

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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid Credentials" });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );
  return res.json({
    error: false,
    message: "Login Successful",
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
});

app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  const isUser = await User.findOne({ _id: userId });
  if (!isUser) {
    return res.status(401).json({ error: true, message: "User not found" });
  }
  return res.json({
    user: isUser,
    message: "User retrieved successfully",
  });
});

// Routes to handle image upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ error: true, message: "No image uploaded" });
        }

        const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

        res.status(201).json({ imageUrl });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete an image from uploads folder
app.delete("/delete-image", async (req, res) => {
    const { imageUrl } = req.query;

    if (!imageUrl) {
        return res
            .status(400)
            .json({ error: true, message: "imageUrl parameter is required" });
    }

    try {
        // Extract the filename from the imageUrl
        const filename = path.basename(imageUrl);

        // Define the file path
        const filePath = path.join(__dirname, "uploads", filename);

        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Delete the file from the uploads folder
            fs.unlinkSync(filePath);
            res.status(200).json({ message: "Image deleted successfully" });
        } else {
            res.status(200).json({ error: true, message: "Image not found" });
        }
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});


//Serve static files from the uploads and assets directory 
app.use("/uploads",express.static(path.join(__dirname,"uploads")));
app.use("/assets",express.static(path.join(__dirname,"assets")));


app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return res.status(400).json({ error: true, message: "All fields are required" });
  }

  //Convert visitedDate from millisecond to Date Object
  const parsedVisitedDate = new Date(parseInt(visitedDate));
  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      visitedDate: parsedVisitedDate,
    });
    await travelStory.save();
    res.status(201).json({ story: travelStory, message: "Added successfully" });
  }
  catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

// Get All Travel Stories
app.get("/get-all-stories", authenticateToken, async (req, res) => {
    const { userId } = req.user;
  
    try {
      const travelStories = await TravelStory.find({ userId: userId }).sort({
        isFavourite: -1,
      });
      res.status(200).json({ stories: travelStories });
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
});


app.put("/edit-story/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
        const { userId } = req.user;

        // Validate required fields
        if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
            return res.status(400).json({
                error: true,
                message: "All fields are required"
            });
        }

        // Convert visitedDate from milliseconds to Date object
        const parsedVisitedDate = new Date(parseInt(visitedDate));

        // Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({
                error: true,
                message: "Travel story not found"
            });
        }

        // Update the travel story fields
        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl;
        travelStory.visitedDate = parsedVisitedDate;

        // Save the updated travel story
        await travelStory.save();

        // Send success response
        return res.status(200).json({
            error: false,
            story: travelStory,
            message: "Update Successful"
        });

    } catch (error) {
        console.error('Error in edit-story:', error);
        return res.status(500).json({
            error: true,
            message: error.message || "Internal server error"
        });
    }
});

app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;

        // Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({
                error: true,
                message: "Travel story not found"
            });
        }

        // Delete the travel story from the database
        await TravelStory.deleteOne({ _id: id, userId: userId });

        // Handle image deletion if exists
        const imageUrl = travelStory.imageUrl;
        if (imageUrl && !imageUrl.startsWith('http')) {
            const path = require('path');
            const fs = require('fs');
            
            // Extract the filename from the imageUrl
            const filename = path.basename(imageUrl);
            
            // Define the file path
            const filePath = path.join(__dirname, 'uploads', filename);
            
            // Delete the image file from the uploads folder
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Failed to delete image file:', err);
                    // Continue with success response even if image deletion fails
                }
            });
        }

        return res.status(200).json({
            error: false,
            message: "Travel story deleted successfully"
        });

    } catch (error) {
        console.error('Error in delete-story:', error);
        return res.status(500).json({
            error: true,
            message: error.message || "Internal server error"
        });
    }
});

app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
    try {
        // Extract parameters from request
        const { id } = req.params;
        const { isFavourite } = req.body;
        const { userId } = req.user;

        // Validate if isFavourite is provided
        if (isFavourite === undefined) {
            return res.status(400).json({
                error: true,
                message: "isFavourite field is required"
            });
        }

        // Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({
                error: true,
                message: "Travel story not found"
            });
        }

        // Update the isFavourite status
        travelStory.isFavourite = isFavourite;

        // Save the updated travel story
        await travelStory.save();

        // Send success response
        return res.status(200).json({
            error: false,
            story: travelStory,
            message: "Update Successful"
        });

    } catch (error) {
        console.error('Error in update-is-favourite:', error);
        return res.status(500).json({
            error: true,
            message: error.message || "Internal server error"
        });
    }
});

app.get("/search", authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        const { userId } = req.user;

        // Validate query parameter
        if (!query) {
            return res.status(400).json({
                error: true,
                message: "Query is required"
            });
        }

        // Perform search with regex across multiple fields
        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { story: { $regex: query, $options: "i" } },
                { visitedLocation: { $regex: query, $options: "i" } }
            ]
        }).sort({ isFavourite: -1 }); // Sort by favorite status (favorites first)

        // Return search results
        return res.status(200).json({
            error: false,
            stories: searchResults,
            message: "Search completed successfully"
        });

    } catch (error) {
        console.error('Error in search:', error);
        return res.status(500).json({
            error: true,
            message: error.message || "Internal server error"
        });
    }
});

app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user;

    try {
        // Convert startDate and endDate from milliseconds to Date objects
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        // Find travel stories that belong to the authenticated user and fall within the date range
        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end },
        }).sort({ isFavourite: -1 });

        res.status(200).json({ stories: filteredStories });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});


// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;




