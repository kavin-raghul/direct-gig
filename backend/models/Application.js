import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coverLetter: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  },
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for better performance
applicationSchema.index({ job: 1, student: 1 }, { unique: true });
applicationSchema.index({ student: 1, appliedAt: -1 });
applicationSchema.index({ organization: 1, status: 1, appliedAt: -1 });

// Update statusUpdatedAt when status changes
applicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusUpdatedAt = new Date();
  }
  next();
});

export default mongoose.model('Application', applicationSchema);