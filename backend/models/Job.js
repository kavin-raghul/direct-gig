import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  category: {
    type: String,
    required: false,
    enum: ['campus-events', 'tutoring', 'research', 'content-creation', 'technical', 'administrative', 'other'],
    index: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  eventDate: {
    type: Date,
    required: true,
    index: true
  },
  workHours: {
    type: Number,
    required: true,
    min: 1,
    max: 24
  },
  deadline: {
    type: Date,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  applicationsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxApplicants: {
    type: Number,
    default: 20,
    min: 1
  }
}, {
  timestamps: true
});

// Indexes for better performance
jobSchema.index({ isActive: 1, deadline: 1, createdAt: -1 });
jobSchema.index({ organization: 1, createdAt: -1 });
jobSchema.index({ category: 1, isActive: 1 });

// Auto-deactivate jobs past deadline
jobSchema.pre('find', function() {
  this.where({ deadline: { $gte: new Date() } });
});

jobSchema.pre('findOne', function() {
  this.where({ deadline: { $gte: new Date() } });
});

export default mongoose.model('Job', jobSchema);