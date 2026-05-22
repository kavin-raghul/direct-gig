import express from 'express';
import Stripe from 'stripe';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Escrow from '../models/Escrow.js';
import Application from '../models/Application.js';

const router = express.Router();

// Initialize Stripe conditionally
const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeSecret) {
  stripe = new Stripe(stripeSecret);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 1. Create a payment checkout session (for deposit into Escrow)
router.post('/create-checkout-session', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('student', 'name email')
      .populate('organization', 'name email organizationName');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only deposit escrow for accepted applications' });
    }

    // Check if an escrow document already exists
    let escrow = await Escrow.findOne({ application: applicationId });
    if (!escrow) {
      escrow = new Escrow({
        application: applicationId,
        job: application.job._id,
        student: application.student._id,
        organization: req.user._id,
        amount: application.job.amount,
        status: 'pending_deposit'
      });
      await escrow.save();
    }

    if (escrow.status !== 'pending_deposit') {
      return res.status(400).json({ message: `Escrow already has status: ${escrow.status}` });
    }

    // Dual-Mode Checkout: Stripe vs Mock
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Gig Escrow: ${application.job.title}`,
                description: `Securing payment of ₹${application.job.amount} for student ${application.student.name}`
              },
              unit_amount: application.job.amount * 100 // convert to paise
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/organization/dashboard?escrow_success=true&appId=${applicationId}`,
        cancel_url: `${FRONTEND_URL}/organization/dashboard?escrow_cancel=true`,
        metadata: {
          escrowId: escrow._id.toString(),
          applicationId: applicationId.toString()
        }
      });

      escrow.stripeSessionId = session.id;
      await escrow.save();

      return res.json({ url: session.url, mode: 'stripe' });
    } else {
      // Mock mode fallback
      console.log('Stripe not configured. Falling back to Mock Payment Mode.');
      const mockCheckoutUrl = `/mock-checkout?escrowId=${escrow._id}&appId=${applicationId}`;
      return res.json({ url: mockCheckoutUrl, mode: 'mock' });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Server error creating checkout session' });
  }
});

// 2. Mock payment confirmation endpoint
router.post('/mock-confirm', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    const { escrowId } = req.body;
    const escrow = await Escrow.findById(escrowId);

    if (!escrow) {
      return res.status(404).json({ message: 'Escrow not found' });
    }

    if (escrow.status !== 'pending_deposit') {
      return res.status(400).json({ message: `Escrow status is already: ${escrow.status}` });
    }

    escrow.status = 'deposited';
    await escrow.save();

    // Notify student of secured payment via real-time socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${escrow.student}`).emit('application_status_updated', {
        applicationId: escrow.application,
        status: 'accepted',
        jobTitle: 'Payment Deposited in Escrow',
        updatedAt: new Date()
      });
    }

    res.json({ message: 'Payment simulated successfully', data: escrow });
  } catch (error) {
    console.error('Error during mock confirmation:', error);
    res.status(500).json({ message: 'Server error during mock confirmation' });
  }
});

// 3. Release escrow to student (Organization action)
router.post('/release-escrow', authenticateToken, requireRole('organization'), async (req, res) => {
  try {
    const { escrowId } = req.body;
    const escrow = await Escrow.findById(escrowId);

    if (!escrow) {
      return res.status(404).json({ message: 'Escrow record not found' });
    }

    if (escrow.status !== 'deposited') {
      return res.status(400).json({ message: 'Escrow is not in deposited state' });
    }

    // In a real application, here we would call Stripe Transfer to send funds to the student.
    escrow.status = 'completed';
    await escrow.save();

    // Send real-time socket notification to the student
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${escrow.student}`).emit('application_status_updated', {
        applicationId: escrow.application,
        status: 'accepted',
        jobTitle: 'Escrow Payment Released',
        updatedAt: new Date()
      });
    }

    res.json({ message: 'Funds released from escrow successfully', data: escrow });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    res.status(500).json({ message: 'Server error releasing escrow' });
  }
});

// 4. Fetch payment/escrow status
router.get('/status/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const escrow = await Escrow.findOne({ application: applicationId })
      .populate('job', 'title description amount location')
      .populate('student', 'name email university course')
      .populate('organization', 'name email organizationName');

    if (!escrow) {
      return res.json({ status: 'none' });
    }

    res.json(escrow);
  } catch (error) {
    console.error('Error fetching escrow status:', error);
    res.status(500).json({ message: 'Server error fetching escrow status' });
  }
});

// 5. Stripe Webhook (for production Stripe checkouts)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!stripe) {
    return res.status(400).send('Stripe is not configured');
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const escrowId = session.metadata.escrowId;

    try {
      const escrow = await Escrow.findById(escrowId);
      if (escrow) {
        escrow.status = 'deposited';
        escrow.stripePaymentIntentId = session.payment_intent;
        await escrow.save();

        console.log(`Payment successfully secured for Escrow ID: ${escrowId}`);
      }
    } catch (dbErr) {
      console.error('Database update failed inside Stripe webhook:', dbErr);
    }
  }

  res.json({ received: true });
});

export default router;
