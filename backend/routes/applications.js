import express from 'express';
import { body, validationResult } from 'express-validator';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply for a job (students only)
router.post('/', authenticateToken, requireRole('student'), [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('coverLetter').notEmpty().trim().withMessage('Cover letter is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { jobId, coverLetter } = req.body;

    // Validate cover letter has at least 5 words
    const words = coverLetter.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length < 5) {
      return res.status(400).json({ message: 'Cover letter must be at least 5 words' });
    }

    // Check if job exists and is active
    const job = await Job.findOne({ 
      _id: jobId, 
      isActive: true,
      deadline: { $gte: new Date() }
    }).populate('organization');

    if (!job) {
      return res.status(404).json({ message: 'Job not found or no longer active' });
    }

    // Check if student already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      student: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Check if max applicants reached
    if (job.applicationsCount >= job.maxApplicants) {
      return res.status(400).json({ message: 'Maximum number of applicants reached' });
    }

    // Create application
    const application = new Application({
      job: jobId,
      student: req.user._id,
      organization: job.organization._id,
      coverLetter
    });

    await application.save();

    // Update job applications count
    job.applicationsCount += 1;
    await job.save();

    // Push real-time notification to the organization socket room
    const io = req.app.get('io');
    if (io) {
      const populatedApp = await Application.findById(application._id).populate('student', 'name email university course year skills phone averageRating ratingsCount');
      io.to(`user_${job.organization._id}`).emit('new_application', populatedApp);
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Get applications for a job (organization only)
router.get('/job/:jobId', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    // Verify job belongs to the organization
    const job = await Job.findOne({ 
      _id: req.params.jobId, 
      organization: req.user._id 
    });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email university course year skills phone averageRating ratingsCount')
      .sort({ appliedAt: -1 });

    // Calculate match score for each applicant
    const applicationsWithScore = applications.map(app => {
      const appObj = app.toObject();
      if (appObj.student) {
        const studentSkills = appObj.student.skills || [];
        const jobSkills = job.skillsRequired || [];
        
        if (jobSkills.length === 0) {
          appObj.matchScore = 100;
        } else {
          const matchingSkills = jobSkills.filter(skill => 
            studentSkills.some(s => s.toLowerCase() === skill.toLowerCase())
          );
          appObj.matchScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
        }
      } else {
        appObj.matchScore = null;
      }
      return appObj;
    });

    res.json(applicationsWithScore);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Get student's applications
router.get('/my-applications', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate({
        path: 'job',
        select: 'title location amount deadline organization',
        populate: {
          path: 'organization',
          select: 'organizationName name averageRating ratingsCount'
        }
      })
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Update application status (organization only)
router.patch('/:id/status', authenticateToken, requireRole('organization'), [
  body('status').isIn(['pending', 'accepted', 'rejected']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { status } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('job', 'organization title');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify job belongs to the organization
    if (application.job.organization.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied - not your job posting' });
    }

    application.status = status;
    await application.save();

    // Push real-time notification to the student socket room
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${application.student}`).emit('application_status_updated', {
        applicationId: application._id,
        status: application.status,
        jobTitle: application.job.title,
        updatedAt: application.updatedAt
      });
    }

    res.json({ 
      message: `Application ${status} successfully`, 
      application 
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error while updating application status' });
  }
});

// Get application statistics for organization
router.get('/stats/organization', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $match: { organization: req.user._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

export default router;