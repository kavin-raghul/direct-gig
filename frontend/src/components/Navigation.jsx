import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Users, Building, LogOut, Briefcase, Bell } from 'lucide-react';
import { FaTachometerAlt } from "react-icons/fa";
import { io } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://direct-gig.onrender.com';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadMessages(response.data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread message count:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();

    const handleUnreadUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('unread-count-updated', handleUnreadUpdate);

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      query: { token },
      withCredentials: true
    });

    socket.on('new_message', (msg) => {
      console.log('Real-time message event in Nav!', msg);
      fetchUnreadCount();
      
      // If user is not currently viewing messages, add a temporary notification alert
      if (msg.sender._id !== user.id && msg.sender._id !== user._id) {
        setNotifications(prev => [
          {
            id: msg._id + Date.now(),
            text: `New message from ${msg.sender.name}: "${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}"`,
            date: new Date()
          },
          ...prev
        ]);
      }
    });

    socket.on('application_status_updated', (data) => {
      console.log('Real-time status event in Nav!', data);
      setNotifications(prev => [
        {
          id: data.applicationId + Date.now(),
          text: `Job "${data.jobTitle}" status updated to ${data.status.toUpperCase()}`,
          date: new Date()
        },
        ...prev
      ]);
    });

    socket.on('new_application', (app) => {
      console.log('Real-time application event in Nav!', app);
      setNotifications(prev => [
        {
          id: app._id + Date.now(),
          text: `New application from ${app.student.name} for "${app.job?.title}"`,
          date: new Date()
        },
        ...prev
      ]);
    });

    return () => {
      socket.disconnect();
      window.removeEventListener('unread-count-updated', handleUnreadUpdate);
    };
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm border-bottom py-2">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="navbar-brand d-flex align-items-center" style={{ cursor: 'pointer' }}>
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
                    {unreadMessages > 0 && (
                      <Badge bg="danger" pill className="ms-2 px-2 py-1" style={{ fontSize: '10px' }}>
                        {unreadMessages}
                      </Badge>
                    )}
                  </Nav.Link>
              </LinkContainer>
            )}
          </Nav>
          
          <Nav className="align-items-center">
            {!isAuthenticated ? (
              <>
                <LinkContainer to="/login">
                  <Nav.Link className="me-2 fw-medium" style={{ cursor: 'pointer' }}>
                    <Users size={16} className="me-1" />
                    Student Login
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/organization/auth">
                  <Button variant="outline-primary" size="sm" className="fw-medium px-3 rounded-pill">
                    <Building size={16} className="me-1" />
                    Organization Login
                  </Button>
                </LinkContainer>
              </>
            ) : (
              <div className="d-flex align-items-center">
                {/* Notifications Bell Dropdown */}
                <Dropdown align="end" className="me-3">
                  <Dropdown.Toggle 
                    variant="light" 
                    id="dropdown-notifications" 
                    className="position-relative border-0 rounded-circle p-2 d-flex align-items-center justify-content-center" 
                    style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                  >
                    <Bell size={20} className="text-muted" />
                    {notifications.length > 0 && (
                      <Badge 
                        bg="danger" 
                        pill 
                        className="position-absolute top-0 end-0 translate-middle-y px-1.5 py-0.5" 
                        style={{ fontSize: '9px' }}
                      >
                        {notifications.length}
                      </Badge>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow border-0 py-2 mt-2" style={{ width: '300px', maxHeight: '350px', overflowY: 'auto', borderRadius: '12px' }}>
                    <div className="px-3 py-2 border-bottom fw-bold d-flex justify-content-between align-items-center">
                      <span className="small text-muted">Real-Time Alerts</span>
                      {notifications.length > 0 && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 text-decoration-none text-primary small" 
                          onClick={() => setNotifications([])}
                          style={{ fontSize: '12px' }}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <Dropdown.Item key={notif.id} className="text-wrap py-2 border-bottom small" style={{ whiteSpace: 'normal' }}>
                          <p className="mb-0 text-dark fw-medium" style={{ fontSize: '12px' }}>{notif.text}</p>
                          <small className="text-muted" style={{ fontSize: '10px' }}>
                            {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                <span className="me-3 text-muted small">
                  Welcome, <strong>{user?.name}</strong>
                </span>
                <Button variant="outline-danger" size="sm" className="px-3 rounded-pill" onClick={handleLogout}>
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