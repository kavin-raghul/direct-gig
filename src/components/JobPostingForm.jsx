import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const JobPostingForm = ({ show, onHide, onJobCreated }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const jobData = {
        ...data,
        stipend: parseFloat(data.stipend),
        skillsRequired: data.skillsRequired ? data.skillsRequired.split(',').map(skill => skill.trim()) : [],
        deadline: new Date(data.deadline).toISOString()
      };

      const response = await api.post('/jobs', jobData);
      onJobCreated(response.data.job);
      reset();
      onHide();
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
        
          
          <Form.Group className="mb-3">
            <Form.Label>Job Title *</Form.Label>
            <Form.Control
              type="text"
              size="lg"
              placeholder="e.g., Campus Event Assistant, Research Helper"
              {...register('title', { required: 'Job title is required' })}
              isInvalid={!!errors.title}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category *</Form.Label>
            <Form.Select
              size="lg"
              {...register('category', { required: 'Category is required' })}
              isInvalid={!!errors.category}
            >
              <option value="">Select Category</option>
              <option value="campus-events">Campus Events</option>
              <option value="tutoring">Tutoring & Teaching</option>
              <option value="research">Research Assistant</option>
              <option value="content-creation">Content Creation</option>
              <option value="technical">Technical Support</option>
              <option value="administrative">Administrative</option>
              <option value="other">Other</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.category?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Job Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Provide detailed description of the job, responsibilities, and expectations..."
              {...register('description', { 
                required: 'Description is required',
                minLength: {
                  value: 50,
                  message: 'Description must be at least 50 characters'
                }
              })}
              isInvalid={!!errors.description}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description?.message}
            </Form.Control.Feedback>
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

          <Form.Group className="mb-3">
            <Form.Label>Application Deadline *</Form.Label>
            <Form.Control
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register('deadline', { 
                required: 'Deadline is required',
                validate: value => new Date(value) > new Date() || 'Deadline must be in the future'
              })}
              isInvalid={!!errors.deadline}
            />
            <Form.Control.Feedback type="invalid">
              {errors.deadline?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Required Skills (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., JavaScript, Communication Skills, Event Management"
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
              variant="primary" 
              type="submit" 
              className="flex-fill py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default JobPostingForm;