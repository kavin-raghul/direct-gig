import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Users, Building, Briefcase, TrendingUp, Shield, Clock, Star, CheckCircle } from 'lucide-react';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} className="text-center">
              <h1 className="display-3 fw-bold mb-4">
                Connect Student with Organizations
              </h1>
              <p className="lead mb-5 fs-4">
                DirectGig eliminates commission fees and connects students directly with organizations 
                for gigs, internships, and part-time opportunities. No middlemen, just direct connections.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <LinkContainer to="/student/auth">
                  <Button variant="light" size="lg" className="px-5 py-3 fw-semibold">
                    <Users className="me-2" size={24} />
                    Join as Student
                  </Button>
                </LinkContainer>
                <LinkContainer to="/organization/auth">
                  <Button variant="outline-light" size="lg" className="px-5 py-3 fw-semibold">
                    <Building className="me-2" size={24} />
                    Post Opportunities
                  </Button>
                </LinkContainer>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center">
            <Col md={4} className="mb-4">
              <div className="display-4 fw-bold text-primary mb-2">0%</div>
              <h5>Commission Fees</h5>
              <p className="text-muted">Students keep 100% of their earnings</p>
            </Col>
            <Col md={4} className="mb-4">
              <div className="display-4 fw-bold text-success mb-2">24/7</div>
              <h5>Platform Access</h5>
              <p className="text-muted">Apply and post jobs anytime</p>
            </Col>
            <Col md={4} className="mb-4">
              <div className="display-4 fw-bold text-warning mb-2">100%</div>
              <h5>Verified Users</h5>
              <p className="text-muted">All users are verified for safety</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Why Choose DirectGig?</h2>
              <p className="lead text-muted">
                The smartest way to connect students with temporary job opportunities
              </p>
            </Col>
          </Row>
          
          <Row>
            <Col lg={4} className="mb-4">
              <Card className="feature-card text-center p-4 h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-4">
                    <Shield size={40} className="text-primary" />
                  </div>
                  <Card.Title className="h4 mb-3">Zero Commission</Card.Title>
                  <Card.Text className="text-muted">
                    No broker fees or hidden charges. Students keep 100% of their earnings 
                    while organizations save on recruitment costs.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} className="mb-4">
              <Card className="feature-card text-center p-4 h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3 mb-4">
                    <Clock size={40} className="text-success" />
                  </div>
                  <Card.Title className="h4 mb-3">Quick Matching</Card.Title>
                  <Card.Text className="text-muted">
                    Find the right students for your temporary jobs quickly. 
                    Our platform makes it easy to post jobs and receive applications.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} className="mb-4">
              <Card className="feature-card text-center p-4 h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex p-3 mb-4">
                    <TrendingUp size={40} className="text-warning" />
                  </div>
                  <Card.Title className="h4 mb-3">Verified Users</Card.Title>
                  <Card.Text className="text-muted">
                    All students and organizations are verified to ensure quality 
                    and trustworthy connections for everyone.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Job Categories Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Popular Job Categories</h2>
              <p className="lead text-muted">
                Find opportunities across various categories
              </p>
            </Col>
          </Row>
          
          <Row>
            {[
              { name: 'Campus Events', icon: '🎉', desc: 'Help organize and manage campus events and activities' },
              { name: 'Tutoring & Teaching', icon: '📚', desc: 'Share your knowledge and help fellow students learn' },
              { name: 'Research Assistant', icon: '🔬', desc: 'Support faculty research projects and data collection' },
              { name: 'Content Creation', icon: '✍️', desc: 'Writing, design, and digital content creation' },
              { name: 'Technical Support', icon: '💻', desc: 'IT support, web development, and technical tasks' },
              { name: 'Administrative', icon: '📋', desc: 'Data entry, documentation, and office assistance' }
            ].map((category, index) => (
              <Col lg={4} md={6} className="mb-4" key={index}>
                <Card className="h-100 text-center p-4 border-0 shadow-sm category-card">
                  <Card.Body>
                    <div style={{ fontSize: '3rem' }} className="mb-3">{category.icon}</div>
                    <Card.Title className="h5 mb-3">{category.name}</Card.Title>
                    <Card.Text className="text-muted">{category.desc}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4">
              <h2 className="display-5 fw-bold mb-4">For Students</h2>
              <div className="mb-3 d-flex align-items-start">
                <CheckCircle className="text-success me-3 mt-1" size={20} />
                <div>
                  <h5 className="mb-2">Flexible Opportunities</h5>
                  <p className="text-muted mb-0">Work around your class schedule with part-time and project-based jobs</p>
                </div>
              </div>
              <div className="mb-3 d-flex align-items-start">
                <CheckCircle className="text-success me-3 mt-1" size={20} />
                <div>
                  <h5 className="mb-2">Skill Development</h5>
                  <p className="text-muted mb-0">Gain real-world experience while earning money</p>
                </div>
              </div>
              <div className="mb-4 d-flex align-items-start">
                <CheckCircle className="text-success me-3 mt-1" size={20} />
                <div>
                  <h5 className="mb-2">Direct Payment</h5>
                  <p className="text-muted mb-0">No commission fees - keep every rupee you earn</p>
                </div>
              </div>
              <LinkContainer to="/student/auth">
                <Button variant="primary" size="lg">
                  Get Started as Student
                </Button>
              </LinkContainer>
            </Col>
            <Col lg={6} className="mb-4">
              <h2 className="display-5 fw-bold mb-4">For Organizations</h2>
              <div className="mb-3 d-flex align-items-start">
                <CheckCircle className="text-primary me-3 mt-1" size={20} />
                <div>
                  <h5 className="mb-2">Talented Pool</h5>
                  <p className="text-muted mb-0">Access motivated students from top universities</p>
                </div>
              </div>
              <div className="mb-3 d-flex align-items-start">
                <CheckCircle className="text-primary me-3 mt-1" size={20} />
                <div>
                  <h5 className="mb-2">Cost Effective</h5>
                  <p className="text-muted mb-0">No recruitment fees or platform commissions</p>
                </div>
              </div>
              <div className="mb-4 d-flex align-items-start">
                <CheckCircle className="text-primary me-3 mt-1" size={20} />
                <div>
                  <h5 className="mb-2">Quick Hiring</h5>
                  <p className="text-muted mb-0">Post jobs and receive applications within hours</p>
                </div>
              </div>
              <LinkContainer to="/organization/auth">
                <Button variant="success" size="lg">
                  Start Hiring Students
                </Button>
              </LinkContainer>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4">Ready to Get Started?</h2>
              <p className="lead mb-5">
                Join thousands of students and organizations already using DirectGig 
                for commission-free job connections.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <LinkContainer to="/student/auth">
                  <Button variant="light" size="lg" className="px-5 py-3">
                    <Users className="me-2" size={20} />
                    Register as Student
                  </Button>
                </LinkContainer>
                <LinkContainer to="/organization/auth">
                  <Button variant="outline-light" size="lg" className="px-5 py-3">
                    <Building className="me-2" size={20} />
                    Register Organization
                  </Button>
                </LinkContainer>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;