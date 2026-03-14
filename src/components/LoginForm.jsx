import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const LoginForm = ({ userType, onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();   // 👈 import useNavigate

  const onSubmit = async (data) => {
    // Clear any existing tokens and errors
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { ...data, userType });

      // Only proceed if login is successful
      if (response.data && response.data.token && response.data.user) {
        // Save token & user
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Call success callback
        onSuccess(response.data);

        // Redirect based on user type
        if (response.data.user?.userType === 'student') {
          navigate('/student/dashboard');
        } else if (response.data.user?.userType === 'organization') {
          navigate('/organization/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('Invalid response from server');
      }

    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Email Address</Form.Label>
        <Form.Control
          type="email"
          size="lg"
          placeholder="Enter your email"
          {...register('email', { 
            required: 'Email is required',
            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
          })}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          size="lg"
          placeholder="Enter your password"
          {...register('password', { required: 'Password is required' })}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
      </Form.Group>

      <Button 
        variant="primary" 
        type="submit" 
        size="lg" 
        className="w-100 py-3 fw-semibold"
        disabled={loading}
      >
        {loading ? 'Signing In...' : `Sign In as ${userType === 'student' ? 'Student' : 'Organization'}`}
      </Button>
    </Form>
  );
};

export default LoginForm;
