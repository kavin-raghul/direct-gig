import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// Helper to generate tokens and send response
const sendTokenResponse = async (user, statusCode, res, message) => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-very-secret';

  const accessToken = jwt.sign({ id: user._id }, secret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, refreshSecret, { expiresIn: '7d' });

  // Save refresh token to user
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' needed for cross origin cookies on some deploys, lax is safer locally
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  const userData = {
    id: user._id,
    email: user.email,
    name: user.name,
    userType: user.userType
  };

  if (user.userType === 'student') {
    userData.university = user.university;
    userData.course = user.course;
    userData.year = user.year;
  } else {
    userData.organizationName = user.organizationName;
  }

  res.status(statusCode)
     .cookie('refreshToken', refreshToken, options)
     .json({ message, token: accessToken, user: userData });
};

// Student registration
router.post('/register/student', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('university').notEmpty().trim().withMessage('University is required'),
  body('course').notEmpty().trim().withMessage('Course is required'),
  body('year').isInt({ min: 1, max: 6 }).withMessage('Year must be between 1 and 6')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password, name, phone, university, course, year, skills } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new student
    const student = new User({
      email,
      password,
      userType: 'student',
      name,
      phone,
      university,
      course,
      year: parseInt(year),
      skills: skills || []
    });

    await student.save();

    await sendTokenResponse(student, 201, res, 'Student account created successfully');
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Organization registration
router.post('/register/organization', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().trim().withMessage('Contact name is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('organizationName').notEmpty().trim().withMessage('Organization name is required'),
  body('address').notEmpty().trim().withMessage('Address is required'),
  body('description').isLength({ min: 20 }).trim().withMessage('Description must be at least 20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password, name, phone, organizationName, address, description } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new organization
    const organization = new User({
      email,
      password,
      userType: 'organization',
      name,
      phone,
      organizationName,
      address,
      description
    });

    await organization.save();

    await sendTokenResponse(organization, 201, res, 'Organization account created successfully');
  } catch (error) {
    console.error('Organization registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('userType').isIn(['student', 'organization']).withMessage('Valid user type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password, userType } = req.body;

    // Find user by email and userType
    const user = await User.findOne({ email, userType });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'Refresh token is missing' });
  }

  try {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-very-secret';
    const decoded = jwt.verify(incomingRefreshToken, refreshSecret);

    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.includes(incomingRefreshToken)) {
      // If the token is not found in the array, it might be heavily compromised
      // For absolute security, we could wipe all refreshTokens here, but for now we just reject it
      if (user) {
        user.refreshTokens = [];
        await user.save({ validateBeforeSave: false });
      }
      return res.status(403).json({ message: 'Invalid refresh token - Please login again' });
    }

    // Replace the old refresh token with a new one (Token Rotation)
    user.refreshTokens = user.refreshTokens.filter(t => t !== incomingRefreshToken);
    await user.save({ validateBeforeSave: false });

    // Send a new set of tokens
    await sendTokenResponse(user, 200, res, 'Token refreshed successfully');
    
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Refresh token expired or invalid' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-very-secret';
      // We wrap verify in try-catch in case it's already expired, so we can still clear it from DB if needed
      try {
        const decoded = jwt.verify(refreshToken, refreshSecret);
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
          await user.save({ validateBeforeSave: false });
        }
      } catch (err) {
        console.log("Logout with expired token, just clearing cookie.");
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Don't reveal that the user does not exist to prevent enumeration attacks
      return res.status(200).json({ message: 'If an account with that email exists, we sent a password reset link.' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    // Make sure we handle frontend url correctly
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
        resetUrl
      });

      res.status(200).json({ message: 'If an account with that email exists, we sent a password reset link.' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.put('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;