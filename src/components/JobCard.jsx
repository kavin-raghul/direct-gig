import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { MapPin, Clock, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';

const JobCard = ({ job, onApply, showApplyButton = true, onViewApplications, showManageButton = false, hasApplied = false }) => {

  const isDeadlinePassed = job?.deadline ? new Date(job.deadline) < new Date() : false;

  return (
    <Card className="job-card h-100 border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <Card.Title className="h5 mb-2 text-primary">{job?.title || "Job Title"}</Card.Title>

            <div className="d-flex flex-wrap gap-2 mb-2">
              <Badge bg="success" className="px-2 py-1">
                <DollarSign size={12} className="me-1" />
                ₹{job?.amount || job?.stipend || 0}
              </Badge>

              {hasApplied && (
                <Badge bg="primary" className="px-2 py-1">
                  <CheckCircle size={12} className="me-1" />
                  Applied
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Card.Text className="text-muted mb-3">
          {job?.description || "No description provided"}
        </Card.Text>

        <div className="mb-3">
          <div className="d-flex align-items-center text-muted mb-2">
            <MapPin size={16} className="me-2 text-primary" />
            <small>{job?.location || "Location not specified"}</small>
          </div>

          <div className="d-flex align-items-center text-muted mb-2">
            <Calendar size={16} className="me-2 text-primary" />
            <small>
              Event Date: {job?.eventDate || job?.deadline 
                ? new Date(job.eventDate || job.deadline).toLocaleDateString()
                : "Not specified"}
            </small>
          </div>

          <div className="d-flex align-items-center text-muted mb-2">
            <Clock size={16} className="me-2 text-primary" />
            <small>Working Hours: {job?.workHours || 8} hours</small>
          </div>

          <div className="d-flex align-items-center text-muted mb-2">
            <Calendar size={16} className="me-2 text-warning" />
            <small>
              Deadline: {job?.deadline
                ? new Date(job.deadline).toLocaleDateString()
                : "Not specified"}
            </small>
          </div>

          {showManageButton && (
            <div className="d-flex align-items-center text-muted">
              <Users size={16} className="me-2 text-primary" />
              <small>{job?.applicationsCount || 0} applications received</small>
            </div>
          )}
        </div>

        {job?.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-2">Required Skills:</small>
            <div>
              {job.skillsRequired.map((skill, index) => (
                <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {job?.organization && !showManageButton && (
          <div className="mb-3">
            <small className="text-muted">
              <strong>Posted by:</strong>{" "}
              {job.organization.organizationName || job.organization.name || "Organization"}
            </small>
          </div>
        )}

        <div className="mt-auto">
          {showApplyButton && (
            <Button 
              variant={hasApplied ? "outline-success" : "primary"}
              className="w-100 py-2 fw-semibold"
              onClick={() => onApply(job)}
              disabled={hasApplied || isDeadlinePassed}
            >
              {hasApplied
                ? "Already Applied"
                : isDeadlinePassed
                ? "Deadline Passed"
                : "Apply Now"}
            </Button>
          )}

          {showManageButton && (
            <Button 
              variant="outline-primary" 
              className="w-100 py-2 fw-semibold"
              onClick={() => onViewApplications(job)}
            >
              <Users className="me-2" size={16} />
              View Applications ({job?.applicationsCount || 0})
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default JobCard;
