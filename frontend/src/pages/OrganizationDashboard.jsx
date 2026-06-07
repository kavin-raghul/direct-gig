import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Tab, Tabs, Alert, Modal, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import JobPostingForm from '../components/JobPostingForm';
import ConversationsList from '../components/ConversationsList';
import MessageModal from '../components/MessageModal';
import PortfolioModal from '../components/PortfolioModal';
import ReviewModal from '../components/ReviewModal';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Plus, Briefcase, FileText, Building, MessageCircle } from 'lucide-react';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://direct-gig.onrender.com';

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Escrow, portfolio & reviews states
  const [escrowStatuses, setEscrowStatuses] = useState({});
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedUserIdForPortfolio, setSelectedUserIdForPortfolio] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApplicationIdForReview, setSelectedApplicationIdForReview] = useState(null);

  const handleOpenPortfolioModal = (userId) => {
    setSelectedUserIdForPortfolio(userId);
    setShowPortfolioModal(true);
  };

  const handleOpenReviewModal = (applicationId) => {
    setSelectedApplicationIdForReview(applicationId);
    setShowReviewModal(true);
  };

  const selectedJobRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadMessages(response.data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread message count:', err);
    }
  };

  // Sync ref with state so the socket listener always has the latest selected job
  useEffect(() => {
    selectedJobRef.current = selectedJob;
  }, [selectedJob]);

  useEffect(() => {
    fetchJobs();
    fetchUnreadCount();

    const handleUnreadUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('unread-count-updated', handleUnreadUpdate);

    const token = localStorage.getItem('token');
    if (!token) return;

    // Setup Socket.IO connection with secure token
    const socket = io(SOCKET_URL, {
      query: { token },
      withCredentials: true
    });

    socket.on('new_application', (application) => {
      console.log('Real-time application received!', application);

      // Notify the organization via banner
      setMessage(`New application from ${application.student.name}!`);
      setTimeout(() => setMessage(''), 6000);

      // If the org is currently viewing the applications for this specific job, update the list instantly
      if (selectedJobRef.current && selectedJobRef.current._id === application.job) {
        setApplications(prev => [application, ...prev]);
      }
    });

    socket.on('new_message', (msg) => {
      console.log('Real-time message received in dashboard!', msg);
      if (msg.sender._id !== user.id && msg.sender._id !== user._id) {
        setMessage(`New message from ${msg.sender.name}!`);
        setTimeout(() => setMessage(''), 5000);
        fetchUnreadCount();
      }
    });

    return () => {
      socket.disconnect();
      window.removeEventListener('unread-count-updated', handleUnreadUpdate);
    };
  }, [user]);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/organization');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    try {
      const response = await api.get(`/applications/job/${jobId}`);
      setApplications(response.data);

      // Fetch escrow status for each accepted application
      const acceptedApps = response.data.filter(app => app.status === 'accepted');
      const statuses = {};
      await Promise.all(acceptedApps.map(async (app) => {
        try {
          const res = await api.get(`/payments/status/${app._id}`);
          statuses[app._id] = res.data;
        } catch (err) {
          console.error(`Error fetching escrow for ${app._id}:`, err);
        }
      }));
      setEscrowStatuses(statuses);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleJobCreated = (newJob) => {
    setJobs([newJob, ...jobs]);
    setMessage('Job posted successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleViewApplications = async (job) => {
    setSelectedJob(job);
    await fetchApplications(job._id);
    setShowApplicationsModal(true);
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      await fetchApplications(selectedJob._id);
      setMessage(`Application ${status} successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowMessagesModal(true);
  };

  const handleCloseMessages = () => {
    setShowMessagesModal(false);
    setSelectedConversation(null);
    fetchUnreadCount();
  };

  // Payment integration handlers
  const handleInitiatePayment = async (applicationId) => {
    try {
      setMessage('Creating payment session...');
      const response = await api.post('/payments/create-checkout-session', { applicationId });
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setMessage('Failed to generate checkout payment URL.');
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setMessage(err.response?.data?.message || 'Payment initiation failed.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleReleaseEscrow = async (escrowId, jobId) => {
    try {
      setMessage('Releasing escrow funds to student...');
      // const response = await api.post('/payments/release-escrow', { escrowId });
      setMessage('Funds released from escrow successfully!');
      setTimeout(() => setMessage(''), 3000);
      await fetchApplications(jobId);
    } catch (err) {
      console.error('Error releasing escrow:', err);
      setMessage(err.response?.data?.message || 'Failed to release escrow.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Check for successful payment redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('escrow_success') === 'true') {
      setMessage('Stipend payment secured in escrow successfully!');
      const appId = urlParams.get('appId');
      if (appId) {
        // Wait a bit to ensure database updates, then refresh job applications
        setTimeout(async () => {
          if (selectedJobRef.current) {
            await fetchApplications(selectedJobRef.current._id);
          }
        }, 1000);
      }
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setMessage('');
      }, 5000);
    } else if (urlParams.get('escrow_cancel') === 'true') {
      setMessage('Payment process was cancelled.');
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setMessage('');
      }, 5000);
    }
  }, []);

  // const getStatusColor = (status) => {
  //   const colors = {
  //     pending: 'warning',
  //     accepted: 'success',
  //     rejected: 'danger'
  //   };
  //   return colors[status] || 'secondary';
  // };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {message && (
        <Alert variant="success" className="text-center">
          {message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <Card className="bg-success text-white border-0 shadow">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col>
                  <h3 className="mb-1 fw-bold">Welcome, {user?.name}!</h3>
                  <p className="mb-0 opacity-75 fs-5">{user?.organizationName}</p>
                </Col>
                <Col xs="auto">
                  <div className="bg-white bg-opacity-20 rounded-circle p-3">
                    <Building size={40} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Job Management</h4>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowJobForm(true)}
          className="px-4"
        >
          <Plus className="me-2" size={20} />
          Post New Job
        </Button>
      </div>

      <Tabs defaultActiveKey="my-jobs" className="mb-4">
        <Tab eventKey="my-jobs" title={
          <span className="d-flex align-items-center">
            <Briefcase className="me-2" size={16} />
            My Jobs ({jobs.length})
          </span>
        }>
          <Row>
            {jobs.length === 0 ? (
              <Col>
                <Alert variant="info" className="text-center py-5">
                  <Briefcase size={48} className="mb-3 text-muted" />
                  <h5>No jobs posted yet</h5>
                  <p className="mb-3 text-muted">Start by posting your first job opportunity for students.</p>
                  <Button variant="primary" onClick={() => setShowJobForm(true)}>
                    <Plus className="me-2" size={16} />
                    Post Your First Job
                  </Button>
                </Alert>
              </Col>
            ) : (
              jobs.map((job) => (
                <Col lg={6} key={job._id} className="mb-4">
                  <JobCard
                    job={job}
                    showApplyButton={false}
                    showManageButton={true}
                    onViewApplications={handleViewApplications}
                  />
                </Col>
              ))
            )}
          </Row>
        </Tab>

        <Tab eventKey="messages" title={
          <span className="d-flex align-items-center">
            <MessageCircle className="me-2" size={16} />
            Messages
            {unreadMessages > 0 && (
              <Badge bg="danger" pill className="ms-2 px-2 py-0.5" style={{ fontSize: '10px' }}>
                {unreadMessages}
              </Badge>
            )}
          </span>
        }>
          <Row>
            <Col lg={8}>
              <ConversationsList onSelectConversation={handleSelectConversation} />
            </Col>
          </Row>
        </Tab>
      </Tabs>

      <JobPostingForm
        show={showJobForm}
        onHide={() => setShowJobForm(false)}
        onJobCreated={handleJobCreated}
      />

      {/* Applications Modal */}
      <Modal show={showApplicationsModal} onHide={() => setShowApplicationsModal(false)} size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Applications for: {selectedJob?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {applications.length === 0 ? (
            <Alert variant="info" className="text-center py-4">
              <FileText size={40} className="mb-3 text-muted" />
              <h6>No applications received yet</h6>
              <p className="mb-0 text-muted">Applications will appear here once students apply.</p>
            </Alert>
          ) : (
            applications.map((application) => (
              <Card key={application._id} className="mb-3 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <Row className="align-items-start">
                    <Col md={8}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">

                        </div>
                        <div>
                          <h6
                            className="mb-0 fw-bold text-primary text-decoration-underline"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOpenPortfolioModal(application.student._id || application.student)}
                          >
                            {application.student.name}
                          </h6>
                          {application.matchScore !== undefined && application.matchScore !== null && (
                            <Badge
                              className="px-2 py-0.5 mt-1 fw-bold d-inline-block"
                              style={{
                                fontSize: '10px',
                                backgroundColor: application.matchScore >= 80 ? 'rgba(46, 204, 113, 0.15)' : application.matchScore >= 50 ? 'rgba(243, 156, 18, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                                color: application.matchScore >= 80 ? '#2ecc71' : application.matchScore >= 50 ? '#f39c12' : '#e74c3c',
                                border: application.matchScore >= 80 ? '1px solid rgba(46, 204, 113, 0.3)' : application.matchScore >= 50 ? '1px solid rgba(243, 156, 18, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)'
                              }}
                            >
                              {application.matchScore}% Match
                            </Badge>
                          )}
                          <div className="text-muted small mt-1">{application.student.email}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1">
                          <strong>University:</strong> {application.student.university}
                        </p>
                        <p className="text-muted mb-1">
                          <strong>Course:</strong> {application.student.course} (Year {application.student.year})
                        </p>
                        <p className="text-muted mb-1">
                          <strong>Phone:</strong> {application.student.phone}
                        </p>
                        {application.student.skills?.length > 0 && (
                          <p className="mb-2">
                            <strong>Skills:</strong>
                            <div className="mt-1">
                              {application.student.skills.map((skill, index) => (
                                <Badge key={index} bg="secondary" className="me-1 mb-1">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </p>
                        )}
                      </div>

                      <div className="mb-3">
                        <strong>Cover Letter:</strong>
                        <div className="mt-2 p-3 bg-light rounded">
                          <p className="mb-0 text-muted">{application.coverLetter}</p>
                        </div>
                      </div>

                      <small className="text-muted">
                        Applied: {new Date(application.appliedAt).toLocaleString()}
                      </small>
                    </Col>
                    <Col md={4} className="text-end">
                      <Badge className={`status-${application.status} mb-3 px-3 py-2`}>
                        {application.status.toUpperCase()}
                      </Badge>
                      {application.status === 'pending' && (
                        <div className="d-grid gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusUpdate(application._id, 'accepted')}
                          >
                            Accept Application
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                          >
                            Reject Application
                          </Button>
                        </div>
                      )}
                      {application.status === 'accepted' && (
                        <div className="d-grid gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center justify-content-center mb-2"
                            onClick={() => {
                              setShowApplicationsModal(false);
                              handleSelectConversation({ application });
                            }}
                          >
                            <MessageCircle size={16} className="me-2" />
                            Message Student
                          </Button>

                          {/* Escrow Payments for organization */}
                          <div className="border rounded p-2.5 text-start bg-light shadow-sm" style={{ fontSize: '12px' }}>
                            <div className="fw-bold mb-1.5 text-primary small d-flex align-items-center gap-1">
                              <span>Secure Escrow Operations</span>
                            </div>

                            {(!escrowStatuses[application._id] || escrowStatuses[application._id].status === 'none') ? (
                              <div>
                                <p className="mb-2 text-muted">Deposited stipend will be held in escrow until release.</p>
                                <Button
                                  variant="success"
                                  size="sm"
                                  className="w-100 fw-bold"
                                  onClick={() => handleInitiatePayment(application._id)}
                                >
                                  Deposit Stipend (₹{selectedJob?.amount})
                                </Button>
                              </div>
                            ) : escrowStatuses[application._id].status === 'pending_deposit' ? (
                              <div>
                                <p className="mb-2 text-warning fw-semibold">🔒 Deposit pending...</p>
                                <Button
                                  variant="success"
                                  size="sm"
                                  className="w-100 fw-bold"
                                  onClick={() => handleInitiatePayment(application._id)}
                                >
                                  Deposit Stipend (₹{selectedJob?.amount})
                                </Button>
                              </div>
                            ) : escrowStatuses[application._id].status === 'deposited' ? (
                              <div>
                                <p className="mb-2 text-success fw-bold">🔒 Secured in Escrow (₹{escrowStatuses[application._id].amount})</p>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="w-100 fw-bold"
                                  onClick={() => handleReleaseEscrow(escrowStatuses[application._id]._id, selectedJob._id)}
                                >
                                  Release Escrow to Student
                                </Button>
                              </div>
                            ) : escrowStatuses[application._id].status === 'completed' ? (
                              <div>
                                <p className="mb-2 text-success fw-bold">💸 Paid & Completed</p>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="w-100 fw-bold"
                                  onClick={() => handleOpenReviewModal(application._id)}
                                >
                                  Leave Review
                                </Button>
                              </div>
                            ) : (
                              <p className="mb-0 text-danger">Refunded / Cancelled</p>
                            )}
                          </div>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))
          )}
        </Modal.Body>
      </Modal>

      {/* Messages Modal */}
      <MessageModal
        show={showMessagesModal}
        onHide={handleCloseMessages}
        application={selectedConversation?.application}
        currentUser={user}
      />
      <PortfolioModal
        show={showPortfolioModal}
        onHide={() => {
          setShowPortfolioModal(false);
          setSelectedUserIdForPortfolio(null);
        }}
        userId={selectedUserIdForPortfolio}
      />

      <ReviewModal
        show={showReviewModal}
        onHide={() => {
          setShowReviewModal(false);
          setSelectedApplicationIdForReview(null);
        }}
        applicationId={selectedApplicationIdForReview}
        onReviewSuccess={() => selectedJob && fetchApplications(selectedJob._id)}
      />
    </Container>
  );
};

export default OrganizationDashboard;