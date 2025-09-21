# DirectGig - Student Job Platform

DirectGig is a full-stack web application that connects students with organizations for gigs, internships, and short-term job opportunities without any commission fees.

## 🚀 Features

### For Students
- **Zero Commission**: Keep 100% of your earnings
- **Flexible Opportunities**: Find part-time jobs that fit your schedule
- **Skill-Based Matching**: Get matched with jobs that suit your skills
- **Application Tracking**: Monitor your application status in real-time

### For Organizations
- **Direct Access**: Connect directly with talented students
- **Cost Effective**: No recruitment fees or platform commissions
- **Quick Hiring**: Post jobs and receive applications within hours
- **Verified Candidates**: All students are verified for quality assurance

## 🛠️ Tech Stack

- **Frontend**: React (Create React App), React Bootstrap, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt password hashing
- **Icons**: Lucide React

## 📁 Project Structure

```
directgig/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── context/           # React context (Auth)
│   ├── services/          # API services
│   └── App.js             # Main app component
├── backend/               # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── server.js         # Express server
└── public/               # Static assets
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB URI and JWT secret

5. Start the server:
   ```bash
   npm run dev
   ```

The backend will run on [http://localhost:5000](http://localhost:5000)

## 📊 Database Schema

### Users Collection
- **Students**: name, email, password, university, course, year, skills
- **Organizations**: name, email, password, organizationName, address, description

### Jobs Collection
- title, description, category, location, stipend, skillsRequired, deadline, organization

### Applications Collection
- job, student, organization, coverLetter, status (pending/accepted/rejected)

## 🔐 Authentication

- JWT-based authentication with 7-day expiration
- Secure password hashing using bcrypt
- Role-based access control (student/organization)
- Protected routes with automatic token validation

## 🎨 UI/UX Features

- Responsive design with React Bootstrap
- Clean, modern interface with smooth animations
- Intuitive navigation and user flows
- Real-time feedback and status updates
- Mobile-friendly design

## 📱 Key Pages

1. **Home**: Landing page with features and call-to-action
2. **Authentication**: Separate login/signup for students and organizations
3. **Student Dashboard**: Browse jobs, search/filter, track applications
4. **Organization Dashboard**: Post jobs, manage applications, view candidates
5. **Job Details**: Detailed job view with application functionality

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/organization` - Organization registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all active jobs (with filters)
- `GET /api/jobs/organization` - Get organization's jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `POST /api/applications` - Submit job application
- `GET /api/applications/job/:jobId` - Get job applications (org)
- `GET /api/applications/my-applications` - Get student applications
- `PATCH /api/applications/:id/status` - Update application status

## 🚀 Deployment

### Frontend
```bash
npm run build
```

### Backend
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@directgig.com or create an issue in the repository.