import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { MessageCircle, User, Building, Clock } from 'lucide-react';
import api from '../services/api';

const ConversationsList = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherUser = (conversation) => {
    const { application } = conversation;
    // This assumes the current user is either student or organization
    // You might need to adjust this based on your user context
    return application.student || application.organization;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2 text-muted">Loading conversations...</p>
    </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <Button variant="outline-danger" size="sm" className="ms-2" onClick={fetchConversations}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-5">
        <MessageCircle size={48} className="text-muted mb-3" />
        <h6 className="text-muted">No conversations yet</h6>
        <p className="text-muted mb-0">
          Messages will appear here once applications are accepted.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-primary text-white border-0">
        <h6 className="mb-0 d-flex align-items-center">
          <MessageCircle className="me-2" size={18} />
          Conversations
        </h6>
      </Card.Header>
      <ListGroup variant="flush">
        {conversations.map((conversation) => {
          const { application, latestMessage, unreadCount } = conversation;
          const otherUser = getOtherUser(conversation);
          const isStudent = otherUser?.userType === 'student';
          const IconComponent = isStudent ? User : Building;

          return (
            <ListGroup.Item
              key={application._id}
              className="border-0 cursor-pointer"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="d-flex align-items-start">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                  <IconComponent size={16} className="text-primary" />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="mb-0 fw-bold">
                      {isStudent ? otherUser?.name : otherUser?.organizationName || otherUser?.name}
                    </h6>
                    {unreadCount > 0 && (
                      <Badge bg="danger" className="ms-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted mb-1 small">
                    <strong>Job:</strong> {application.job?.title}
                  </p>
                  {latestMessage ? (
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="text-muted mb-0 small" style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {latestMessage.content}
                      </p>
                      <small className="text-muted ms-2 d-flex align-items-center">
                        <Clock size={12} className="me-1" />
                        {formatTime(latestMessage.createdAt)}
                      </small>
                    </div>
                  ) : (
                    <p className="text-muted mb-0 small">
                      No messages yet
                    </p>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Card>
  );
};

export default ConversationsList;

