import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Alert, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import ApplicationModal from '../components/ApplicationModal';
import ConversationsList from '../components/ConversationsList';
import MessageModal from '../components/MessageModal';
import PortfolioModal from '../components/PortfolioModal';
import ReviewModal from '../components/ReviewModal';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Briefcase, FileText, User, Search, Filter, MessageCircle } from 'lucide-react';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://direct-gig.onrender.com';

const StudentDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Escrow & review/portfolio states
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

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadMessages(response.data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread message count:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchUnreadCount();
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnreadUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('unread-count-updated', handleUnreadUpdate);

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      query: { token },
      withCredentials: true
    });

    socket.on('application_status_updated', (data) => {
      console.log('Application status update received in real-time!', data);
      setMessage(`Application status updated to "${data.status.toUpperCase()}" for job: ${data.jobTitle}!`);
      setTimeout(() => setMessage(''), 6000);

      // Update applications state in real-time
      setApplications(prev =>
        prev.map(app =>
          app._id === data.applicationId
            ? { ...app, status: data.status, updatedAt: data.updatedAt }
            : app
        )
      );
    });

    socket.on('new_job', (newJob) => {
      console.log('Real-time new job posted!', newJob);
      // Prepend the new job to the jobs list if it's not already in it
      setJobs(prev => {
        if (prev.some(j => j._id === newJob._id)) return prev;
        return [newJob, ...prev];
      });
    });

    socket.on('new_message', (msg) => {
      console.log('Real-time message received in student dashboard!', msg);
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

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter]);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications/my-applications');
      setApplications(response.data);

      // Fetch escrow status for accepted applications
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

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skillsRequired?.some(skill =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleApply = (job) => {
    const hasApplied = applications.some(app => app.job._id === job._id);

    if (hasApplied) {
      setMessage('You have already applied for this job!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setMessage('Application submitted successfully!');
    fetchApplications();
    fetchJobs();
    setTimeout(() => setMessage(''), 3000);
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
          <Card className="bg-primary text-white border-0 shadow">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col>
                  <h3 className="mb-1 fw-bold">Welcome back, {user?.name}!</h3>
                  <p className="mb-0 opacity-75 fs-5">
                    {user?.course} • {user?.university}
                  </p>
                  <div className="mt-2 text-white bg-white bg-opacity-10 d-inline-block px-3 py-1 rounded-pill small">
                    <span className="text-warning">★</span> {user?.averageRating > 0 ? user.averageRating.toFixed(1) : 'No rating yet'} ({user?.ratingsCount || 0} reviews)
                  </div>
                </Col>
                <Col xs="auto">
                  <div className="bg-white bg-opacity-20 rounded-circle p-3">
                    <User size={40} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="browse" className="mb-4">

        {/* Browse Jobs */}
        <Tab eventKey="browse" title={
          <span className="d-flex align-items-center">
            <Briefcase className="me-2" size={16} />
            Browse Jobs ({filteredJobs.length})
          </span>
        }>

          <Row className="mb-4">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search jobs by title, description, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          <Row>
            {filteredJobs.length === 0 ? (
              <Col>
                <Alert variant="info" className="text-center py-5">
                  <Briefcase size={48} className="mb-3 text-muted" />
                  <h5>No jobs found</h5>
                  <p className="mb-0 text-muted">
                    {searchTerm || locationFilter
                      ? 'Try adjusting your search criteria'
                      : 'No jobs available at the moment. Check back later!'
                    }
                  </p>
                </Alert>
              </Col>
            ) : (
              filteredJobs.map((job) => (
                <Col lg={6} key={job._id} className="mb-4">
                  <JobCard
                    job={job}
                    onApply={handleApply}
                    showApplyButton={true}
                    hasApplied={applications.some(app => app.job && app.job._id === job._id)}
                    onOpenOrgPortfolio={handleOpenPortfolioModal}
                  />
                </Col>
              ))
            )}
          </Row>

        </Tab>

        {/* Applications */}
        <Tab eventKey="applications" title={
          <span className="d-flex align-items-center">
            <FileText className="me-2" size={16} />
            My Applications ({applications.length})
          </span>
        }>

          <Row>
            {applications.length === 0 ? (
              <Col>
                <Alert variant="info" className="text-center py-5">
                  <FileText size={48} className="mb-3 text-muted" />
                  <h5>No applications yet</h5>
                  <p className="mb-0 text-muted">
                    You haven't applied for any jobs yet. Browse available jobs to get started!
                  </p>
                </Alert>
              </Col>
            ) : (
              applications.map((application) => (
                <Col lg={6} key={application._id} className="mb-4">
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body className="p-4">

                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Card.Title className="h5 mb-0">
                          {application.job?.title || 'Job details unavailable'}
                        </Card.Title>

                        <Badge className={`status-${application.status} px-3 py-2`}>
                          {application.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1">
                          <strong>Organization:</strong>{' '}
                          <span
                            className="text-primary fw-semibold text-decoration-underline"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOpenPortfolioModal(application.job?.organization?._id || application.job?.organization)}
                          >
                            {application.job?.organization?.organizationName || application.job?.organization?.name || 'Unknown'}
                          </span>
                          <span className="text-warning small ms-2 fw-semibold">
                            ★ {application.job?.organization?.averageRating > 0 ? application.job.organization.averageRating.toFixed(1) : 'N/A'} ({application.job?.organization?.ratingsCount || 0})
                          </span>
                        </p>
                        <p className="text-muted mb-1">
                          <strong>Location:</strong> {application.job?.location || 'N/A'}
                        </p>
                        <p className="text-muted mb-1">
                          <strong>Stipend:</strong> {application.job ? `₹${application.job.amount || application.job.stipend}` : 'N/A'}
                        </p>
                        <p className="text-muted mb-0">
                          <strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <Card.Text className="small mb-3">
                        <strong>Your Cover Letter:</strong><br />
                        <span className="text-muted">
                          {application.coverLetter.length > 100
                            ? `${application.coverLetter.substring(0, 100)}...`
                            : application.coverLetter
                          }
                        </span>
                      </Card.Text>

                      {application.status === 'accepted' && (
                        <div className="mt-3 p-3 rounded shadow-sm" style={{ backgroundColor: 'rgba(var(--bs-primary-rgb), 0.03)', border: '1px solid rgba(var(--bs-primary-rgb), 0.1)' }}>
                          <h6 className="fw-bold mb-2 text-primary small d-flex align-items-center justify-content-between">
                            <span>Escrow Payments & Progress</span>
                          </h6>
                          <div className="d-flex flex-column gap-1.5 mb-3 small">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="text-muted">1. Candidate Selected</span>
                              <span className="text-success fw-bold">✓ Complete</span>
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                              <span className="text-muted">2. Escrow Deposit</span>
                              {(!escrowStatuses[application._id] || escrowStatuses[application._id].status === 'none' || escrowStatuses[application._id].status === 'pending_deposit') ? (
                                <span className="text-warning fw-semibold animate-pulse">🔒 Awaiting Deposit...</span>
                              ) : (
                                <span className="text-success fw-bold">🔒 Secured (₹{escrowStatuses[application._id].amount})</span>
                              )}
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                              <span className="text-muted">3. Release & Pay</span>
                              {escrowStatuses[application._id]?.status === 'completed' ? (
                                <span className="text-success fw-bold">💸 Released to Bank</span>
                              ) : (
                                <span className="text-muted">Awaiting Release</span>
                              )}
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="flex-grow-1 d-flex align-items-center justify-content-center py-2"
                              onClick={() => handleSelectConversation({ application })}
                            >
                              <MessageCircle size={16} className="me-2" />
                              Chat
                            </Button>

                            {escrowStatuses[application._id]?.status === 'completed' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-grow-1 py-2 fw-semibold"
                                onClick={() => handleOpenReviewModal(application._id)}
                              >
                                Leave Review
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>

        </Tab>

        {/* Messages */}
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

      <ApplicationModal
        show={showApplicationModal}
        onHide={() => setShowApplicationModal(false)}
        job={selectedJob}
        onApplicationSuccess={handleApplicationSuccess}
      />

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
        onReviewSuccess={fetchApplications}
      />

    </Container>
  );
};

export default StudentDashboard;