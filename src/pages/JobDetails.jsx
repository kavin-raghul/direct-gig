import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Users, Building, ArrowLeft, Calendar } from 'lucide-react';
import api from '../services/api';
import ApplicationModal from '../components/ApplicationModal';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [message, setMessage] = useState('');

  const fetchJobDetails = useCallback(async () => {
    try {
      const response = await api.get('/jobs');
      const jobData = response.data.find(j => j._id === id);
      setJob(jobData);
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleApply = () => {
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setMessage('Application submitted successfully!');
    fetchJobDetails();
    setTimeout(() => setMessage(''), 3000);
  };

  const formatCategory = (category) => {
    return category.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  if (!job) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h5>Job not found</h5>
          <p className="mb-0">This job may have been removed or is no longer available.</p>
        </Alert>
      </Container>
    );
  }

  const isDeadlinePassed = new Date(job.deadline) < new Date();

  return (
    <Container className="py-4">
      {message && (
        <Alert variant="success" className="text-center">
          {message}
        </Alert>
      )}

      <Button
        variant="outline-secondary"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="me-2" size={16} />
        Back to Jobs
      </Button>

      <Row>
        <Col lg={8}>
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="mb-4">
                <h2 className="mb-3 text-primary">{job.title}</h2>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Badge bg="info" className="px-3 py-2">
                    {formatCategory(job.category)}
                  </Badge>

                  <Badge bg="success" className="px-3 py-2">
                    <DollarSign size={14} className="me-1" />
                    ₹{job.stipend}
                  </Badge>

                  {isDeadlinePassed && (
                    <Badge bg="danger" className="px-3 py-2">
                      Deadline Passed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="mb-3">Job Description</h5>
                <div className="p-3 bg-light rounded">
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {job.description}
                  </p>
                </div>
              </div>

              {job.skillsRequired && job.skillsRequired.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-3">Required Skills</h5>
                  <div>
                    {job.skillsRequired.map((skill, index) => (
                      <Badge key={index} bg="secondary" className="me-2 mb-2 px-3 py-2">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Row className="mb-4">
                <Col md={6}>
                  <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                    <MapPin size={24} className="me-3 text-primary" />
                    <div>
                      <strong>Location</strong><br />
                      <span className="text-muted">{job.location}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                    <Calendar size={24} className="me-3 text-primary" />
                    <div>
                      <strong>Application Deadline</strong><br />
                      <span className="text-muted">
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">

              <div className="d-flex align-items-center mb-4">
                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                  <Building size={24} className="text-success" />
                </div>

                <div>
                  <h6 className="mb-0 fw-bold">
                    {job.organization?.organizationName}
                  </h6>
                  <small className="text-muted">
                    Contact: {job.organization?.name}
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
                <Users size={20} className="me-3 text-primary" />
                <div>
                  <strong>Applications</strong><br />
                  <span className="text-muted">
                    {job.applicationsCount || 0} received
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <small className="text-muted">
                  Posted: {new Date(job.createdAt).toLocaleDateString()}
                </small>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-100 py-3 fw-semibold"
                onClick={handleApply}
                disabled={isDeadlinePassed}
              >
                {isDeadlinePassed ? 'Deadline Passed' : 'Apply for This Job'}
              </Button>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      <ApplicationModal
        show={showApplicationModal}
        onHide={() => setShowApplicationModal(false)}
        job={job}
        onApplicationSuccess={handleApplicationSuccess}
      />

    </Container>
  );
};

export default JobDetails;
