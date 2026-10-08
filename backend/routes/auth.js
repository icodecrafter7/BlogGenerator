import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Blog from '../models/Blog.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Helper to generate JWT and set HTTP-only cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'empathwrite_ultra_secure_jwt_secret_token_2026',
    { expiresIn: '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio || ""
      }
    });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error(`Signup Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(`Login Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @desc    Guest login / generate guest session
// @route   POST /api/auth/guest
// @access  Public
router.post('/guest', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'guest@empathwrite.local' });
    if (!user) {
      user = await User.create({
        name: 'Guest Creator',
        email: 'guest@empathwrite.local',
        password: 'guest_secure_password_2026_salt',
        bio: 'Just another writer looking for inspiration'
      });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(`Guest Login Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error during guest login' });
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // expires in 10s
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get user profile data (Public)
// @route   GET /api/auth/profile/:userId
// @access  Public
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all public blogs authored by this user
    const publicBlogs = await Blog.find({ userId: user._id, status: 'published', visibility: 'public' })
      .sort({ createdAt: -1 });

    // Find total blogs
    const totalBlogs = publicBlogs.length;

    // Calculate total likes received across all public blogs
    let totalLikesReceived = 0;
    publicBlogs.forEach(blog => {
      totalLikesReceived += blog.likes ? blog.likes.length : 0;
    });

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        bio: user.bio || '',
        joinedDate: user.createdAt,
        totalBlogs,
        totalLikesReceived,
        blogs: publicBlogs
      }
    });
  } catch (error) {
    console.error(`Get Profile Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error retrieving user profile' });
  }
});

// @desc    Update user profile (Private)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio || ''
      }
    });
  } catch (error) {
    console.error(`Update Profile Route Error: ${error.message}`);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

export default router;
