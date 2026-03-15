import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card,  Badge, Tab, Tabs, Alert, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import ApplicationModal from '../components/ApplicationModal';
import ConversationsList from '../components/ConversationsList';
import MessageModal from '../components/MessageModal';
import api from '../services/api';
import { Briefcase, FileText, User, Search, Filter, MessageCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

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
        job.skillsRequired.some(skill => 
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
    // Check if already applied
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
  };

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
          <Card className="bg-primary text-white border-0 shadow">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col>
                  <h3 className="mb-1 fw-bold">Welcome back, {user?.name}!</h3>
                  <p className="mb-0 opacity-75 fs-5">{user?.course} • {user?.university}</p>
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
        <Tab eventKey="browse" title={
          <span className="d-flex align-items-center">
            <Briefcase className="me-2" size={16} />
            Browse Jobs ({filteredJobs.length})
          </span>
        }>
          {/* Search and Filter */}
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
                    hasApplied={applications.some(app => app.job._id === job._id)}
                  />
                </Col>
              ))
            )}
          </Row>
        </Tab>

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
                        <Card.Title className="h5 mb-0">{application.job.title}</Card.Title>
                        <Badge className={`status-${application.status} px-3 py-2`}>
                          {application.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-muted mb-1">
                          <strong>Organization:</strong> {application.job.organization?.organizationName}
                        </p>
                        <p className="text-muted mb-1">
                          <strong>Location:</strong> {application.job.location}
                        </p>
                        <p className="text-muted mb-1">
                          <strong>Stipend:</strong> ₹{application.job.stipend}
                        </p>
                        <p className="text-muted mb-0">
                          <strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <Card.Text className="small">
                        <strong>Your Cover Letter:</strong><br />
                        <span className="text-muted">
                          {application.coverLetter.length > 100 
                            ? `${application.coverLetter.substring(0, 100)}...`
                            : application.coverLetter
                          }
                        </span>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Tab>
        
        <Tab eventKey="messages" title={
          <span className="d-flex align-items-center">
            <MessageCircle className="me-2" size={16} />
            Messages
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

      {/* Messages Modal */}
      <MessageModal
        show={showMessagesModal}
        onHide={handleCloseMessages}
        application={selectedConversation?.application}
        currentUser={user}
      />
    </Container>
  );
};

export default StudentDashboard;