import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { Star, Award } from 'lucide-react';
import api from '../services/api';

const ReviewModal = ({ show, onHide, applicationId, onReviewSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Feedback comment is required');
      return;
    }
    if (comment.length < 5 || comment.length > 500) {
      setError('Comment must be between 5 and 500 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/reviews', {
        applicationId,
        rating,
        comment: comment.trim()
      });

      setSuccess('Review submitted successfully!');
      setTimeout(() => {
        setSuccess('');
        setComment('');
        setRating(5);
        onReviewSuccess();
        onHide();
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="glass-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center">
          <Award className="me-2 text-primary" size={20} />
          Leave a Review
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* Stars Selection */}
          <Form.Group className="mb-4 text-center">
            <Form.Label className="d-block fw-semibold text-muted mb-2">How was your experience?</Form.Label>
            <div className="d-flex justify-content-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isLit = hoverRating ? starValue <= hoverRating : starValue <= rating;
                return (
                  <Star
                    key={starValue}
                    size={36}
                    className={`cursor-pointer transition-colors ${
                      isLit ? "text-warning fill-warning" : "text-muted"
                    }`}
                    style={{
                      fill: isLit ? 'currentColor' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                );
              })}
            </div>
            <div className="mt-2 fw-bold text-primary" style={{ fontSize: '14px' }}>
              {rating === 5 && 'Excellent! ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Good Job! ⭐⭐⭐⭐'}
              {rating === 3 && 'Average! ⭐⭐⭐'}
              {rating === 2 && 'Poor! ⭐⭐'}
              {rating === 1 && 'Very Dissatisfied! ⭐'}
            </div>
          </Form.Group>

          {/* Comment text */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-muted">Feedback Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Tell us about the gig, performance, punctuality, and communication..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <Form.Text className="text-muted d-flex justify-content-between mt-1">
              <span>Must be at least 5 characters.</span>
              <span>{comment.length}/500</span>
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading || comment.length < 5}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ReviewModal;
