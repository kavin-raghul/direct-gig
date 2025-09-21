import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const OrganizationRegistrationForm = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register/organization', data);
      onSuccess(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert variant="danger">{error}</Alert>}
  
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Contact Person Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter contact person name"
              {...register('name', { required: 'Contact name is required' })}
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email Address *</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter organization email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              })}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Password *</Form.Label>
            <Form.Control
              type="password"
              placeholder="Create a password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              isInvalid={!!errors.password}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password *</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              isInvalid={!!errors.confirmPassword}
            />
            <Form.Control.Feedback type="invalid">
              {errors.confirmPassword?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Organization Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter organization name"
              {...register('organizationName', { required: 'Organization name is required' })}
              isInvalid={!!errors.organizationName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.organizationName?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number *</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Enter phone number"
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Enter a valid 10-digit phone number'
                }
              })}
              isInvalid={!!errors.phone}
            />
            <Form.Control.Feedback type="invalid">
              {errors.phone?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Address *</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Enter organization address"
          {...register('address', { required: 'Address is required' })}
          isInvalid={!!errors.address}
        />
        <Form.Control.Feedback type="invalid">
          {errors.address?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Organization Description *</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Brief description of your organization and what you do..."
          {...register('description', { 
            required: 'Description is required',
            minLength: {
              value: 20,
              message: 'Description must be at least 20 characters'
            }
          })}
          isInvalid={!!errors.description}
        />
        <Form.Control.Feedback type="invalid">
          {errors.description?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button 
        variant="primary" 
        type="submit" 
        size="lg" 
        className="w-100 py-3 fw-semibold"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Organization Account'}
      </Button>
    </Form>
  );
};

export default OrganizationRegistrationForm;