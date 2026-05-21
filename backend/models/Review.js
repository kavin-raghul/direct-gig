import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  reviewerRole: {
    type: String,
    enum: ['student', 'organization'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can only review a specific application/hire once
reviewSchema.index({ application: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, rating: -1 });

export default mongoose.model('Review', reviewSchema);
