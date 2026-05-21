import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import Review from '../models/Review.js';
import Application from '../models/Application.js';
import Escrow from '../models/Escrow.js';
import User from '../models/User.js';

const router = express.Router();

// 1. Submit a review for a completed gig
router.post('/', authenticateToken, [
  body('applicationId').isMongoId().withMessage('Valid application ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').isLength({ min: 5, max: 500 }).trim().withMessage('Comment must be 5-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { applicationId, rating, comment } = req.body;

    // Verify application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only review accepted applications' });
    }

    // Verify payment is completed/released before leaving review
    const escrow = await Escrow.findOne({ application: applicationId });
    if (!escrow || escrow.status !== 'completed') {
      return res.status(400).json({ message: 'Can only leave reviews after funds have been released' });
    }

    // Determine roles
    const currentUserId = req.user._id.toString();
    const isStudent = currentUserId === application.student.toString();
    const isOrganization = currentUserId === application.organization.toString();

    if (!isStudent && !isOrganization) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Identify reviewee
    const reviewerRole = isStudent ? 'student' : 'organization';
    const revieweeId = isStudent ? application.organization : application.student;

    // Check if review already exists from this user
    const existingReview = await Review.findOne({ application: applicationId, reviewer: currentUserId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this application' });
    }

    // Create review
    const review = new Review({
      application: applicationId,
      reviewer: currentUserId,
      reviewee: revieweeId,
      rating,
      comment,
      reviewerRole
    });

    await review.save();

    // Recalculate average rating for reviewee
    const allReviews = await Review.find({ reviewee: revieweeId });
    const ratingsCount = allReviews.length;
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = parseFloat((totalRating / ratingsCount).toFixed(2));

    // Update User model
    await User.findByIdAndUpdate(revieweeId, {
      averageRating,
      ratingsCount
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error while submitting review' });
  }
});

// 2. Get reviews received by a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name organizationName userType')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

export default router;
