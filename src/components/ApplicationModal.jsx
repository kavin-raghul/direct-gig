import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { MapPin, Calendar } from 'lucide-react';
import api from '../services/api';

const ApplicationModal = ({ show, onHide, job, onApplicationSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      await api.post('/applications', {
        jobId: job._id,
        coverLetter: data.coverLetter
      });
      
      onApplicationSuccess();
      reset();
      onHide();
    } catch (error) {
      setError(error.response?.data?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCategory = (category) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
              <Badge bg="info" className="me-2">{formatCategory(job.category)}</Badge>
              <Badge bg="success">₹{job.stipend}</Badge>
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
                  <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
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
      
          <Form.Group className="mb-4">
            <Form.Label>Cover Letter *</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Tell the organization why you're perfect for this job. Include relevant experience, skills, and availability..."
              {...register('coverLetter', { 
                required: 'Cover letter is required',
                minLength: {
                  value: 50,
                  message: 'Cover letter must be at least 50 characters'
                }
              })}
              isInvalid={!!errors.coverLetter}
            />
            <Form.Control.Feedback type="invalid">
              {errors.coverLetter?.message}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Minimum 50 characters required. Be specific about your qualifications and interest.
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-3">
            <Button variant="secondary" onClick={onHide} className="flex-fill py-2">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              className="flex-fill py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ApplicationModal;
