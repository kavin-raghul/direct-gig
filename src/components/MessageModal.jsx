import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Card, Badge } from 'react-bootstrap';
import { Send, MessageCircle, User, Building } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://direct-gig.onrender.com';

const MessageModal = ({ show, onHide, application, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const currentUserId = currentUser?.id || currentUser?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (show && application) {
      fetchMessages();
    }
  }, [show, application]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!show || !application) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      query: { token },
      withCredentials: true
    });

    socket.on('new_message', (msg) => {
      console.log('Real-time message received in modal:', msg);
      if (msg.application === application._id || msg.application?._id === application._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark as read in backend if we are the receiver
        if (msg.sender._id !== currentUserId && msg.sender !== currentUserId) {
          api.patch('/messages/mark-read', { applicationId: application._id })
            .then(() => {
              window.dispatchEvent(new CustomEvent('unread-count-updated'));
            })
            .catch(err => {
              console.error('Failed to mark message as read:', err);
            });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [show, application, currentUserId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/messages/application/${application._id}`);
      setMessages(response.data);
      
      // Mark messages as read
      await api.patch('/messages/mark-read', { applicationId: application._id });
      window.dispatchEvent(new CustomEvent('unread-count-updated'));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      const response = await api.post('/messages', {
        applicationId: application._id,
        content: newMessage.trim()
      });

      setMessages(prev => {
        if (prev.some(m => m._id === response.data.data._id)) return prev;
        return [...prev, response.data.data];
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = () => {
    if (!application) return null;
    
    if (currentUser.userType === 'student') {
      return {
        name: application.organization?.organizationName || application.organization?.name,
        type: 'Organization',
        icon: Building
      };
    } else {
      return {
        name: application.student?.name,
        type: 'Student',
        icon: User
      };
    }
  };

  const otherUser = getOtherUser();
  const IconComponent = otherUser?.icon || User;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center">
          <MessageCircle className="me-2" size={20} />
          Messages - {application?.job?.title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="pt-0">
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        
        {/* Other User Info */}
        {otherUser && (
          <Card className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Row className="align-items-center">
                <Col xs="auto">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                    <IconComponent size={20} className="text-primary" />
                  </div>
                </Col>
                <Col>
                  <h6 className="mb-0 fw-bold">{otherUser.name}</h6>
                  <small className="text-muted">{otherUser.type}</small>
                </Col>
                <Col xs="auto">
                  <Badge bg="success" className="px-2 py-1">
                    Application Accepted
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Messages */}
        <div 
          className="messages-container border rounded p-3 mb-3" 
          style={{ height: '400px', overflowY: 'auto' }}
        >
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading messages...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <MessageCircle size={40} className="mb-2" />
              <p className="mb-0">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`mb-3 d-flex ${
                  message.sender._id === currentUserId ? 'justify-content-end' : 'justify-content-start'
                }`}
              >
                <div
                  className={`message-bubble p-3 rounded ${
                    message.sender._id === currentUserId
                      ? 'bg-primary text-white'
                      : 'bg-light border'
                  }`}
                  style={{ maxWidth: '70%' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <small className={`fw-bold ${
                      message.sender._id === currentUserId ? 'text-white-50' : 'text-muted'
                    }`}>
                      {message.sender._id === currentUserId ? 'You' : message.sender.name}
                    </small>
                    <small className={`${
                      message.sender._id === currentUserId ? 'text-white-50' : 'text-muted'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </small>
                  </div>
                  <p className="mb-0">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <Form onSubmit={sendMessage}>
          <Row className="g-2">
            <Col>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                maxLength={1000}
              />
            </Col>
            <Col xs="auto">
              <Button
                type="submit"
                variant="primary"
                disabled={!newMessage.trim() || sending}
                className="h-100 px-3"
              >
                {sending ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Sending...</span>
                  </div>
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </Col>
          </Row>
          <small className="text-muted">
            {newMessage.length}/1000 characters
          </small>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default MessageModal;

