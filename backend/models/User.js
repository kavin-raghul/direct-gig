import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    required: true,
    enum: ['student', 'organization'],
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  // Student specific fields
  university: {
    type: String,
    required: function() { return this.userType === 'student'; },
    trim: true
  },
  course: {
    type: String,
    required: function() { return this.userType === 'student'; },
    trim: true
  },
  year: {
    type: Number,
    required: function() { return this.userType === 'student'; },
    min: 1,
    max: 6
  },
  skills: [{
    type: String,
    trim: true
  }],
  resume: {
    type: String, // URL or file path
    default: null
  },
  // Organization specific fields
  organizationName: {
    type: String,
    required: function() { return this.userType === 'organization'; },
    trim: true
  },
  address: {
    type: String,
    required: function() { return this.userType === 'organization'; },
    trim: true
  },
  description: {
    type: String,
    required: function() { return this.userType === 'organization'; },
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  refreshTokens: [String],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1, userType: 1 });
userSchema.index({ userType: 1, createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password and sensitive tokens from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export default mongoose.model('User', userSchema);