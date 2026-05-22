import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // If still loading, show nothing (parent will handle loading state)
  if (loading) {
    return null;
  }

  // If user is authenticated, redirect to their dashboard
  if (isAuthenticated && user) {
    if (user.userType === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user.userType === 'organization') {
      return <Navigate to="/organization/dashboard" replace />;
    }
  }

  // If not authenticated, redirect to student login (default)
  return <Navigate to="/login" replace />;
};

export default LoginRedirect;

