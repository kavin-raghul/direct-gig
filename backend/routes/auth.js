import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    { expiresIn: '7d' }
  );
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

    const token = generateToken(student._id);
    res.status(201).json({
      message: 'Student account created successfully',
      token,
      user: {
        id: student._id,
        email: student.email,
        name: student.name,
        userType: student.userType,
        university: student.university,
        course: student.course,
        year: student.year
      }
    });
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

    const token = generateToken(organization._id);
    res.status(201).json({
      message: 'Organization account created successfully',
      token,
      user: {
        id: organization._id,
        email: organization.email,
        name: organization.name,
        userType: organization.userType,
        organizationName: organization.organizationName
      }
    });
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

    const token = generateToken(user._id);
    
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      userType: user.userType
    };

    // Add role-specific data
    if (userType === 'student') {
      userData.university = user.university;
      userData.course = user.course;
      userData.year = user.year;
    } else {
      userData.organizationName = user.organizationName;
    }

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
});

export default router;