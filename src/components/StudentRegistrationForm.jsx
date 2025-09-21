import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const StudentRegistrationForm = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register/student', {
        ...data,
        skills: data.skills ? data.skills.split(',').map(skill => skill.trim()) : []
      });
      
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
            <Form.Label>Full Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your full name"
              {...register('name', { required: 'Name is required' })}
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
              placeholder="Enter your email"
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

      <Form.Group className="mb-3">
        <Form.Label>Phone Number *</Form.Label>
        <Form.Control
          type="tel"
          placeholder="Enter your phone number"
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

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>University *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Your university name"
              {...register('university', { required: 'University is required' })}
              isInvalid={!!errors.university}
            />
            <Form.Control.Feedback type="invalid">
              {errors.university?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Course/Major *</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Computer Science"
              {...register('course', { required: 'Course is required' })}
              isInvalid={!!errors.course}
            />
            <Form.Control.Feedback type="invalid">
              {errors.course?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Year of Study *</Form.Label>
        <Form.Select
          {...register('year', { required: 'Year is required' })}
          isInvalid={!!errors.year}
        >
          <option value="">Select your year</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
          <option value="5">5th Year</option>
          <option value="6">6th Year</option>
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          {errors.year?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Skills (Optional)</Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g., JavaScript, Content Writing, Event Management"
          {...register('skills')}
        />
        <Form.Text className="text-muted">
          Separate multiple skills with commas
        </Form.Text>
      </Form.Group>

      <Button 
        variant="primary" 
        type="submit" 
        size="lg" 
        className="w-100 py-3 fw-semibold"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Student Account'}
      </Button>
    </Form>
  );
};

export default StudentRegistrationForm;