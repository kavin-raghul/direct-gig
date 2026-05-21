import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Application from '../models/Application.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Send a message (both students and organizations)
router.post('/', authenticateToken, [
  body('applicationId').isMongoId().withMessage('Valid application ID is required'),
  body('content').isLength({ min: 1, max: 1000 }).trim().withMessage('Message content must be 1-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { applicationId, content } = req.body;

    // Find the application and verify access
    const application = await Application.findById(applicationId)
      .populate('student', 'name email')
      .populate('organization', 'name email organizationName');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is part of this application
    const isStudent = req.user._id.toString() === application.student._id.toString();
    const isOrganization = req.user._id.toString() === application.organization._id.toString();

    if (!isStudent && !isOrganization) {
      return res.status(403).json({ message: 'Access denied - not part of this application' });
    }

    // Check if application is accepted (only allow messaging for accepted applications)
    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Messaging is only available for accepted applications' });
    }

    // Determine receiver
    const receiver = isStudent ? application.organization._id : application.student._id;

    // Create message
    const message = new Message({
      application: applicationId,
      sender: req.user._id,
      receiver: receiver,
      content
    });

    await message.save();

    // Populate sender details
    await message.populate('sender', 'name email organizationName');

    // Emit real-time message event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiver}`).emit('new_message', message);
      io.to(`user_${req.user._id}`).emit('new_message', message);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// Get messages for an application
router.get('/application/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Find the application and verify access
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is part of this application
    const isStudent = req.user._id.toString() === application.student.toString();
    const isOrganization = req.user._id.toString() === application.organization.toString();

    if (!isStudent && !isOrganization) {
      return res.status(403).json({ message: 'Access denied - not part of this application' });
    }

    // Get messages for this application
    const messages = await Message.find({ application: applicationId })
      .populate('sender', 'name email organizationName')
      .populate('receiver', 'name email organizationName')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    // Get all accepted applications where user is involved
    const applications = await Application.find({
      $or: [
        { student: req.user._id },
        { organization: req.user._id }
      ],
      status: 'accepted'
    })
    .populate('student', 'name email')
    .populate('organization', 'name email organizationName')
    .populate('job', 'title')
    .sort({ statusUpdatedAt: -1 });

    // Get latest message for each application
    const conversations = await Promise.all(
      applications.map(async (app) => {
        const latestMessage = await Message.findOne({ application: app._id })
          .populate('sender', 'name email organizationName')
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          application: app._id,
          receiver: req.user._id,
          isRead: false
        });

        return {
          application: app,
          latestMessage,
          unreadCount
        };
      })
    );

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
});

// Mark messages as read
router.patch('/mark-read', authenticateToken, [
  body('applicationId').isMongoId().withMessage('Valid application ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { applicationId } = req.body;

    // Verify user has access to this application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isStudent = req.user._id.toString() === application.student.toString();
    const isOrganization = req.user._id.toString() === application.organization.toString();

    if (!isStudent && !isOrganization) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      { 
        application: applicationId, 
        receiver: req.user._id, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error while marking messages as read' });
  }
});

// Get unread message count for user
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

export default router;

