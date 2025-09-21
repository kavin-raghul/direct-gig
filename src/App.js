import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import StudentAuth from './pages/StudentAuth';
import OrganizationAuth from './pages/OrganizationAuth';
import StudentDashboard from './pages/StudentDashboard';
import OrganizationDashboard from './pages/OrganizationDashboard';
import JobDetails from './pages/JobDetails';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Container fluid className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/student/auth" element={<StudentAuth />} />
              <Route path="/organization/auth" element={<OrganizationAuth />} />
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute userType="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/dashboard" 
                element={
                  <ProtectedRoute userType="organization">
                    <OrganizationDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/job/:id" 
                element={
                  <ProtectedRoute userType="student">
                    <JobDetails />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Container>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;