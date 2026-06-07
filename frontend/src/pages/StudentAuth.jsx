import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentRegistrationForm from '../components/StudentRegistrationForm';
import LoginForm from '../components/LoginForm';
import { GraduationCap } from 'lucide-react';

const StudentAuth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAuthSuccess = (data) => {
    login(data.user, data.token);
    setSuccess(data.message);
    setTimeout(() => {
      navigate('/student/dashboard');
    }, 1500);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={6} md={8}>
          <Card className="auth-card shadow-lg border-0">
            <Card.Header className="bg-primary text-white text-center py-4 border-0">
              <GraduationCap size={48} className="mb-3" />
              <h3 className="mb-2 fw-bold">Student Portal</h3>
              <p className="mb-0 opacity-75">Find gigs, internships, and part-time opportunities</p>
            </Card.Header>
            
            <Card.Body className="p-5">
              {success && (
                <Alert variant="success" className="text-center">
                  {success}
                </Alert>
              )}
              
              <Nav variant="pills" className="justify-content-center mb-4">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'login'} 
                    onClick={() => setActiveTab('login')}
                    className="px-4"
                  >
                    Sign In
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'register'} 
                    onClick={() => setActiveTab('register')}
                    className="px-4"
                  >
                    Sign Up
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {activeTab === 'login' ? (
                <LoginForm 
                  userType="student" 
                  onSuccess={handleAuthSuccess}
                />
              ) : (
                <StudentRegistrationForm 
                  onSuccess={handleAuthSuccess}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentAuth;