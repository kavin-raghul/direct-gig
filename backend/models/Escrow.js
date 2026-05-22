import mongoose from 'mongoose';

const escrowSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    unique: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_deposit', 'deposited', 'completed', 'refunded'],
    default: 'pending_deposit',
    index: true
  },
  stripeSessionId: {
    type: String,
    default: null
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for query performance
escrowSchema.index({ application: 1 });
escrowSchema.index({ student: 1, status: 1 });
escrowSchema.index({ organization: 1, status: 1 });

export default mongoose.model('Escrow', escrowSchema);
