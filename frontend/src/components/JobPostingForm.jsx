import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const JobPostingForm = ({ show, onHide, onJobCreated }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const description = watch('description', '');
  const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;


  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const jobData = {
        ...data,
        amount: parseFloat(data.stipend),
        skillsRequired: data.skillsRequired ? data.skillsRequired.split(',').map(skill => skill.trim()) : [],
        deadline: new Date(data.deadline).toISOString(),
        eventDate: new Date(data.eventDate).toISOString(),
        workHours: parseInt(data.workHours)
      };

      const response = await api.post('/jobs', jobData);
      onJobCreated(response.data.job);
      setSuccess('Job posted successfully!');
      reset();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onHide();
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>Post New Job Opportunity</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-0">
        <Form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        
          
          <Form.Group className="mb-3">
            <Form.Label>Job Title *</Form.Label>
            <Form.Control
              type="text"
              size="lg"
              placeholder="Enter the title"
              {...register('title', { required: 'Job title is required' })}
              isInvalid={!!errors.title}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title?.message}
            </Form.Control.Feedback>
          </Form.Group>


          <Form.Group className="mb-3">
            <Form.Label>Job Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Enter at least 5 words describing the job..."
              {...register('description', { 
                required: 'Description is required',
                validate: value => {
                  const words = value.trim().split(/\s+/).filter(word => word.length > 0);
                  if (words.length < 5) {
                    return 'Description must be at least 5 words';
                  }
                  return true;
                }
              })}
              isInvalid={!!errors.description}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description?.message}
            </Form.Control.Feedback>
            <Form.Text className={`text-muted ${wordCount >= 5 ? 'text-success' : 'text-warning'}`}>
              Must be at least 5 words (current: {wordCount}/5)
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Location *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Main Campus, Building A"
                  {...register('location', { required: 'Location is required' })}
                  isInvalid={!!errors.location}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.location?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stipend (₹) *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g., 5000"
                  {...register('stipend', { 
                    required: 'Stipend is required',
                    min: {
                      value: 100,
                      message: 'Stipend must be at least ₹100'
                    }
                  })}
                  isInvalid={!!errors.stipend}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.stipend?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Event Date *</Form.Label>
                <Form.Control
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('eventDate', { 
                    required: 'Event date is required',
                    validate: value => new Date(value) > new Date() || 'Event date must be in the future'
                  })}
                  isInvalid={!!errors.eventDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.eventDate?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Working Hours *</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="24"
                  placeholder="e.g., 8"
                  {...register('workHours', { 
                    required: 'Working hours is required',
                    min: {
                      value: 1,
                      message: 'Must be at least 1 hour'
                    },
                    max: {
                      value: 24,
                      message: 'Cannot exceed 24 hours'
                    }
                  })}
                  isInvalid={!!errors.workHours}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.workHours?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Application Deadline *</Form.Label>
            <Form.Control
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register('deadline', { 
                required: 'Deadline is required',
                validate: value => {
                  const deadline = new Date(value);
                  const today = new Date();
                  const eventDate = new Date(document.querySelector('input[name="eventDate"]')?.value);
                  
                  if (deadline <= today) {
                    return 'Deadline must be in the future';
                  }
                  if (eventDate && deadline >= eventDate) {
                    return 'Deadline must be before the event date';
                  }
                  return true;
                }
              })}
              isInvalid={!!errors.deadline}
            />
            <Form.Control.Feedback type="invalid">
              {errors.deadline?.message}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Deadline must be before the event date
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Required Skills (Optional)</Form.Label>
            <Form.Control
              type="text"
              {...register('skillsRequired')}
            />
            <Form.Text className="text-muted">
              Separate multiple skills with commas
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
              {loading ? 'Posting...' : success ? 'Posted Successfully!' : 'Post Job'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default JobPostingForm;