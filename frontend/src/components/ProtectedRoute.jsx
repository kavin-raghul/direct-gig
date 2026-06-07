import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const ProtectedRoute = ({ children, userType }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Verifying authentication...</p>
      </Container>
    );
  }

  // Only redirect if authentication is confirmed to be invalid
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Check user type if specified
  if (userType && user?.userType !== userType) {
    console.log(`User type mismatch. Expected: ${userType}, Got: ${user?.userType}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;