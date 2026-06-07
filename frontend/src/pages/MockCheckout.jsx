import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

const MockCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const escrowId = searchParams.get('escrowId');
  const appId = searchParams.get('appId');

  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Card details states (mock)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('424');
  const [cardName, setCardName] = useState('');

  const fetchEscrowDetails = useCallback(async () => {
    try {
      const response = await api.get(`/payments/status/${appId}`);
      if (response.data.status === 'none') {
        setError('No active escrow setup found for this application.');
      } else {
        setEscrow(response.data);
        if (response.data.organization && response.data.organization.organizationName) {
          setCardName(response.data.organization.organizationName);
        }
      }
    } catch (err) {
      console.error('Error fetching escrow details:', err);
      setError('Failed to fetch transaction details. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (!escrowId || !appId) {
      setError(
        'Missing payment identifiers. Please try initiating checkout from the dashboard again.'
      );
      setLoading(false);
      return;
    }

    fetchEscrowDetails();
  }, [escrowId, appId, fetchEscrowDetails]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !cardName) {
      setError('Please fill in all card details.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await api.post('/payments/mock-confirm', { escrowId });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/organization/dashboard?escrow_success=true&appId=${appId}`);
      }, 2000);
    } catch (err) {
      console.error('Error confirming mock payment:', err);
      setError(err.response?.data?.message || 'Payment simulation failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/organization/dashboard?escrow_cancel=true');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted">Setting up secure sandbox environment...</p>
      </Container>
    );
  }

  if (error && !escrow) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center shadow-sm">
          <p className="mb-3 fw-bold">{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/organization/dashboard')}>
            <ArrowLeft size={16} className="me-2" /> Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-lg border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
            <Row className="g-0">
              {/* Left Column: Order Summary */}
              <Col md={5} className="bg-light p-4 p-lg-5 border-end">
                <div className="mb-4">
                  <Badge bg="warning" text="dark" className="px-2.5 py-1.5 fw-semibold mb-3">
                    Sandbox Escrow Mode
                  </Badge>
                  <h4 className="fw-bold text-dark">Payment Summary</h4>
                  <p className="text-muted small">DirectGig Secure Escrow Portal</p>
                </div>

                {escrow && (
                  <div className="mt-4">
                    <div className="mb-3">
                      <small className="text-muted d-block">Gig / Role</small>
                      <span className="fw-semibold text-dark">{escrow.job.title}</span>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Hired Student</small>
                      <span className="fw-semibold text-dark">{escrow.student.name}</span>
                      <small className="text-muted d-block">{escrow.student.university}</small>
                    </div>
                    <div className="mb-4">
                      <small className="text-muted d-block">Client Organization</small>
                      <span className="fw-semibold text-dark">{escrow.organization.organizationName || escrow.organization.name}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <span className="fw-bold h5 mb-0">Total Due:</span>
                      <span className="fw-extrabold h4 text-primary mb-0">₹{escrow.amount}</span>
                    </div>
                    <div className="mt-4 text-muted small d-flex align-items-start gap-2">
                      <ShieldCheck size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Funds will be held securely in escrow and released only when work is completed.
                      </span>
                    </div>
                  </div>
                )}
              </Col>

              {/* Right Column: Checkout Form */}
              <Col md={7} className="p-4 p-lg-5 bg-white d-flex flex-column justify-content-center">
                {success ? (
                  <div className="text-center py-4">
                    <CheckCircle size={64} className="text-success mb-3 animate-bounce" />
                    <h3 className="fw-bold text-success mb-2">Simulated Payment Received!</h3>
                    <p className="text-muted">DirectGig Escrow holds ₹{escrow?.amount} securely.</p>
                    <p className="text-muted small">Redirecting you to dashboard...</p>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="fw-bold mb-0">Pay with Sandbox Card</h4>
                      <Lock size={18} className="text-muted" />
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handlePay}>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-semibold">Cardholder Name</Form.Label>
                        <Form.Control
                          type="text"
                          className="py-2.5"
                          placeholder="e.g. John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          disabled={processing}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="text-muted small fw-semibold">Card Number</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            className="py-2.5 ps-5"
                            placeholder="4242 4242 4242 4242"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            disabled={processing}
                          />
                          <CreditCard size={18} className="text-muted position-absolute" style={{ left: '16px', top: '15px' }} />
                        </div>
                      </Form.Group>

                      <Row>
                        <Col xs={6}>
                          <Form.Group className="mb-4">
                            <Form.Label className="text-muted small fw-semibold">Expiration Date</Form.Label>
                            <Form.Control
                              type="text"
                              className="py-2.5"
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                              disabled={processing}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6}>
                          <Form.Group className="mb-4">
                            <Form.Label className="text-muted small fw-semibold">CVV</Form.Label>
                            <Form.Control
                              type="text"
                              className="py-2.5"
                              placeholder="123"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              disabled={processing}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button
                        variant="primary"
                        type="submit"
                        disabled={processing}
                        className="w-100 py-3 fw-bold mb-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                      >
                        {processing ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            Processing Transaction...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Deposit ₹{escrow?.amount} into Escrow
                          </>
                        )}
                      </Button>

                      <Button
                        variant="link"
                        onClick={handleCancel}
                        disabled={processing}
                        className="w-100 text-center text-muted text-decoration-none small py-1"
                      >
                        Cancel payment and return
                      </Button>
                    </Form>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MockCheckout;
