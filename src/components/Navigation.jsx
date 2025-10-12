import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Users, Building, LogOut, Briefcase } from 'lucide-react';
import { FaTachometerAlt } from "react-icons/fa";
const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm border-bottom">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="navbar-brand d-flex align-items-center">
            <Briefcase size={28} className="me-2 text-primary" />
            DirectGig
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <LinkContainer to={user?.userType === 'student' ? '/student/dashboard' : '/organization/dashboard'}>
               <Nav.Link className="me-2 text-primary fw-semibold d-flex align-items-center">
                  <FaTachometerAlt className="me-1" />
                    Dashboard
                  </Nav.Link>
              </LinkContainer>
            )}
          </Nav>
          
          <Nav>
            {!isAuthenticated ? (
              <>
                <LinkContainer to="/login">
                  <Nav.Link className="me-2">
                    <Users size={16} className="me-1" />
                    Student Login
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/organization/auth">
                  <Button variant="outline-primary" size="sm">
                    <Building size={16} className="me-1" />
                    Organization Login
                  </Button>
                </LinkContainer>
              </>
            ) : (
              <div className="d-flex align-items-center">
                <span className="me-3 text-muted">
                  Welcome, <strong>{user?.name}</strong>
                </span>
                <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                  <LogOut size={16} className="me-1" />
                  Logout
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;