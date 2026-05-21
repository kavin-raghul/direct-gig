import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Card, Spinner, Alert } from 'react-bootstrap';
import { User, Building, Star, Award, BookOpen, Mail, Phone, Calendar } from 'lucide-react';
import api from '../services/api';

const PortfolioModal = ({ show, onHide, userId }) => {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && userId) {
      fetchPortfolioData();
    } else if (!show) {
      setProfile(null);
      setReviews([]);
      setError('');
    }
  }, [show, userId]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    setError('');
    
    // Safely extract string ID if userId is passed as an object
    const targetUserId = typeof userId === 'object' && userId !== null ? (userId._id || userId.id) : userId;
    if (!targetUserId) {
      setError('Invalid user ID provided.');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user details
      const userRes = await api.get(`/auth/user/${targetUserId}`);
      setProfile(userRes.data);

      // 2. Fetch user reviews
      const reviewsRes = await api.get(`/reviews/user/${targetUserId}`);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? "text-warning fill-warning" : "text-muted"}
          style={{ fill: i <= rating ? 'currentColor' : 'none' }}
        />
      );
    }
    return <div className="d-flex gap-1">{stars}</div>;
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="glass-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center">
          <Award className="me-2 text-primary" size={24} />
          Profile Portfolio
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Retrieving portfolio details...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : profile ? (
          <div>
            {/* Header info */}
            <Card className="border-0 shadow-sm bg-light mb-4">
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col xs="auto" className="pe-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                      {profile.userType === 'student' ? (
                        <User size={36} className="text-primary" />
                      ) : (
                        <Building size={36} className="text-primary" />
                      )}
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                      <h4 className="fw-bold mb-0">
                        {profile.userType === 'student' ? profile.name : (profile.organizationName || profile.name)}
                      </h4>
                      <Badge bg={profile.userType === 'student' ? 'primary' : 'success'} className="px-2.5 py-1 text-capitalize">
                        {profile.userType}
                      </Badge>
                    </div>
                    
                    {/* Rating display */}
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div className="d-flex align-items-center text-warning fw-semibold">
                        <Star size={16} className="fill-warning me-1 text-warning" style={{ fill: 'currentColor' }} />
                        {profile.averageRating > 0 ? profile.averageRating : 'N/A'}
                      </div>
                      <span className="text-muted small">
                        ({profile.ratingsCount} {profile.ratingsCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Profile specifications */}
            <Row className="mb-4">
              <Col md={6} className="mb-3 mb-md-0">
                <h6 className="fw-bold border-bottom pb-2 mb-3">About & Credentials</h6>
                {profile.userType === 'student' ? (
                  <div className="d-flex flex-column gap-2 text-muted small">
                    <div className="d-flex align-items-center">
                      <BookOpen size={16} className="me-2 text-primary" />
                      <strong>University:</strong> &nbsp;{profile.university}
                    </div>
                    <div className="d-flex align-items-center">
                      <Award size={16} className="me-2 text-primary" />
                      <strong>Course:</strong> &nbsp;{profile.course} (Year {profile.year})
                    </div>
                    <div className="d-flex align-items-center">
                      <Mail size={16} className="me-2 text-primary" />
                      <strong>Email:</strong> &nbsp;{profile.email}
                    </div>
                    <div className="d-flex align-items-center">
                      <Phone size={16} className="me-2 text-primary" />
                      <strong>Phone:</strong> &nbsp;{profile.phone}
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2 text-muted small">
                    <div className="d-flex align-items-center">
                      <Building size={16} className="me-2 text-success" />
                      <strong>Contact:</strong> &nbsp;{profile.name}
                    </div>
                    <div className="d-flex align-items-center">
                      <Mail size={16} className="me-2 text-success" />
                      <strong>Email:</strong> &nbsp;{profile.email}
                    </div>
                    <div className="d-flex align-items-center">
                      <Phone size={16} className="me-2 text-success" />
                      <strong>Phone:</strong> &nbsp;{profile.phone}
                    </div>
                    <p className="mb-0 mt-1">
                      <strong>Address:</strong> &nbsp;{profile.address}
                    </p>
                    <p className="mb-0">
                      <strong>Description:</strong> &nbsp;{profile.description}
                    </p>
                  </div>
                )}
              </Col>

              <Col md={6}>
                <h6 className="fw-bold border-bottom pb-2 mb-3">Skills & Attributes</h6>
                {profile.userType === 'student' ? (
                  <div>
                    {profile.skills && profile.skills.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {profile.skills.map((skill, idx) => (
                          <Badge key={idx} bg="secondary" className="px-2 py-1.5 fw-medium text-dark bg-opacity-10" style={{ backgroundColor: 'rgba(108, 117, 125, 0.1)' }}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted small">No skills specified.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted small">Verified Gig hiring organization.</p>
                )}
              </Col>
            </Row>

            {/* Reviews Section */}
            <div>
              <h6 className="fw-bold border-bottom pb-2 mb-3">Reviews & Feedback</h6>
              {reviews.length === 0 ? (
                <div className="text-center py-4 bg-light rounded text-muted small">
                  No ratings or reviews received yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {reviews.map((rev) => (
                    <Card key={rev._id} className="border-0 shadow-sm bg-light">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <div className="fw-bold small me-2">
                              {rev.reviewer ? (rev.reviewer.userType === 'student' ? rev.reviewer.name : rev.reviewer.organizationName || rev.reviewer.name) : 'Anonymous'}
                            </div>
                            <Badge bg={rev.reviewer?.userType === 'student' ? 'primary' : 'success'} style={{ fontSize: '9px' }}>
                              {rev.reviewer?.userType || 'user'}
                            </Badge>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {renderStars(rev.rating)}
                            <small className="text-muted" style={{ fontSize: '10px' }}>
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <p className="mb-0 text-muted small italic">"{rev.comment}"</p>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">No profile selected.</div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PortfolioModal;
