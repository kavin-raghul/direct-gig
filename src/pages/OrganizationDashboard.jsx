import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tab, Tabs, Alert, Modal, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import JobPostingForm from '../components/JobPostingForm';
import ConversationsList from '../components/ConversationsList';
import MessageModal from '../components/MessageModal';
import api from '../services/api';
import { Plus, Briefcase, FileText, Building, Users, MessageCircle } from 'lucide-react';

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

  useEffect(() => {
    fetchJobs();
  }, []);

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
                          <h6 className="mb-0 fw-bold">{application.student.name}</h6>
                          <small className="text-muted">{application.student.email}</small>
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
    </Container>
  );
};

export default OrganizationDashboard;