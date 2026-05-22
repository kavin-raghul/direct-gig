import express from 'express';
import { body, validationResult } from 'express-validator';
import Job from '../models/Job.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all active jobs (public route with optional auth for matching)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { location, search } = req.query;
    
    let query = { 
      isActive: true,
      deadline: { $gte: new Date() }
    };

    // Apply filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const jobs = await Job.find(query)
      .populate('organization', 'organizationName name email averageRating ratingsCount')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Calculate match score if the logged-in user is a student
    let jobsWithMatchScore = jobs.map(job => {
      const jobObj = job.toObject();
      if (req.user && req.user.userType === 'student') {
        const studentSkills = req.user.skills || [];
        const jobSkills = job.skillsRequired || [];
        
        if (jobSkills.length === 0) {
          jobObj.matchScore = 100;
        } else {
          const matchingSkills = jobSkills.filter(skill => 
            studentSkills.some(s => s.toLowerCase() === skill.toLowerCase())
          );
          jobObj.matchScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
        }
      } else {
        jobObj.matchScore = null;
      }
      return jobObj;
    });

    // If student is logged-in, sort by match score descending, then by creation date
    if (req.user && req.user.userType === 'student') {
      jobsWithMatchScore.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    
    res.json(jobsWithMatchScore);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error while fetching jobs' });
  }
});

// Get jobs by organization
router.get('/organization', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    const jobs = await Job.find({ organization: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching organization jobs:', error);
    res.status(500).json({ message: 'Server error while fetching jobs' });
  }
});

// Get single job details
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ 
      _id: req.params.id, 
      isActive: true,
      deadline: { $gte: new Date() }
    }).populate('organization', 'organizationName name email averageRating ratingsCount');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found or no longer active' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ message: 'Server error while fetching job details' });
  }
});

// Create new job
router.post('/', authenticateToken, requireRole('organization'), [
  body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('location').notEmpty().trim().withMessage('Location is required'),
  body('amount').isNumeric().isFloat({ min: 100 }).withMessage('Amount must be at least ₹100'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('workHours').isInt({ min: 1, max: 24 }).withMessage('Work hours must be between 1-24')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { deadline, eventDate, ...jobData } = req.body;
    
    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    const eventDateObj = new Date(eventDate);
    
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }
    
    if (eventDateObj <= new Date()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }
    
    if (deadlineDate >= eventDateObj) {
      return res.status(400).json({ message: 'Deadline must be before event date' });
    }

    const job = new Job({
      ...jobData,
      deadline: deadlineDate,
      eventDate: eventDateObj,
      organization: req.user._id,
      amount: parseFloat(jobData.amount)
    });

    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('organization', 'organizationName name email averageRating ratingsCount');

    // Broadcast the new job to all connected sockets in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('new_job', populatedJob);
    }

    res.status(201).json({
      message: 'Job posted successfully',
      job: populatedJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error while creating job' });
  }
});

// Update job
router.put('/:id', authenticateToken, requireRole('organization'), [
  body('title').optional().notEmpty().trim().isLength({ max: 200 }),
  body('description').optional().notEmpty().trim(),
  body('amount').optional().isNumeric().isFloat({ min: 100 }),
  body('deadline').optional().isISO8601(),
  body('eventDate').optional().isISO8601(),
  body('workHours').optional().isInt({ min: 1, max: 24 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const job = await Job.findOne({ _id: req.params.id, organization: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    // Validate deadline if provided
    if (req.body.deadline) {
      const deadlineDate = new Date(req.body.deadline);
      if (deadlineDate <= new Date()) {
        return res.status(400).json({ message: 'Deadline must be in the future' });
      }
      req.body.deadline = deadlineDate;
    }

    Object.assign(job, req.body);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('organization', 'organizationName name email');

    res.json({ 
      message: 'Job updated successfully', 
      job: populatedJob 
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error while updating job' });
  }
});

// Delete job
router.delete('/:id', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ 
      _id: req.params.id, 
      organization: req.user._id 
    });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error while deleting job' });
  }
});

export default router;