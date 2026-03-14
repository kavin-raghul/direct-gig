import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { MapPin, Calendar, Clock } from 'lucide-react';
import api from '../services/api';

const ApplicationModal = ({ show, onHide, job, onApplicationSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear success message when modal opens
  useEffect(() => {
    if (show) {
      setSuccess('');
      setError('');
    }
  }, [show]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Submitting application for job:', job._id);
      console.log('Cover letter length:', data.coverLetter.length);
      
      const response = await api.post('/applications', {
        jobId: job._id,
        coverLetter: data.coverLetter
      });
      
      console.log('Application submitted successfully:', response.data);
      onApplicationSuccess();
      setSuccess('Application submitted successfully!');
      reset();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onHide();
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Application submission error:', error);
      setError(error.response?.data?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>Apply for Job</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-0">
        {job && (
          <div className="mb-4 p-4 bg-light rounded">
            <h5 className="mb-3 text-primary">{job.title}</h5>
            <div className="mb-3">
              <Badge bg="success">₹{job.amount}</Badge>
            </div>
            <div className="row text-muted">
              <div className="col-md-6 mb-2">
                <div className="d-flex align-items-center">
                  <MapPin size={16} className="me-2" />
                  <span>{job.location}</span>
                </div>
              </div>
              <div className="col-md-6 mb-2">
                <div className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" />
                  <span>Event Date: {new Date(job.eventDate || job.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="col-md-6 mb-2">
                <div className="d-flex align-items-center">
                  <Clock size={16} className="me-2" />
                  <span>Working Hours: {job.workHours || 8} hours</span>
                </div>
              </div>
              <div className="col-md-6 mb-2">
                <div className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" />
                  <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <p className="mb-2"><strong>Description:</strong> {job.description}</p>
            <p className="mb-2"><strong>Organization:</strong> {job.organization?.organizationName || job.organization?.name}</p>
            {job.skillsRequired?.length > 0 && (
              <div>
                <strong>Required Skills:</strong>
                <div className="mt-1">
                  {job.skillsRequired.map((skill, index) => (
                    <Badge key={index} bg="secondary" className="me-1 mb-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
      
          <Form.Group className="mb-4">
            <Form.Label>Cover Letter *</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Tell the organization why you're perfect for this job. Include relevant experience, skills, and availability..."
              {...register('coverLetter', { 
                required: 'Cover letter is required',
                validate: value => {
                  const words = value.trim().split(/\s+/).filter(word => word.length > 0);
                  if (words.length < 5) {
                    return 'Cover letter must be at least 5 words';
                  }
                  return true;
                }
              })}
              isInvalid={!!errors.coverLetter}
            />
            <Form.Control.Feedback type="invalid">
              {errors.coverLetter?.message}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Must be at least 5 words. Be specific about your qualifications and interest.
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-3">
            <Button variant="secondary" onClick={onHide} className="flex-fill py-2">
              Cancel
            </Button>
            <Button 
              variant={success ? "success" : "primary"} 
              type="submit" 
              className="flex-fill py-2 fw-semibold"
              disabled={loading || success}
            >
              {loading ? 'Submitting...' : success ? 'Application Submitted!' : 'Submit Application'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ApplicationModal;