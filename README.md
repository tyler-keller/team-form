# Student Team Creation Tool

A full-stack application for creating and managing student teams with React frontend, Express backend, and SQLite database.

## Quick Start Guide

Follow these steps to get the application running locally on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/tyler-keller/team-form.git
cd team-form
```

### 2. Install Dependencies

Install all dependencies for both the frontend and backend:

```bash
npm run install:all
```

### 3. Database Setup

Initialize the SQLite database and Prisma client:

```bash
npm run db:setup
```

### 4. Run the Application

Start both the frontend and backend servers in development mode:

```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:3000` (or similar, check terminal output)
- Backend: `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user (student or instructor)
- `POST /api/login` - Login user

### Core
- `GET /api/hello` - Hello world endpoint
- `GET /api/health` - Health check

### Students
- `GET /api/students` - Get all students with team memberships
- `POST /api/students` - Create or update a student profile
- `PUT /api/students/:studentId` - Update specific student details

### Instructors
- `GET /api/instructors` - Get all instructors with projects
- `POST /api/instructors` - Create a new instructor

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get specific project details
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:projectId` - Edit project details
- `GET /api/projects/:projectId/students` - Get students associated with a project
- `POST /api/projects/:projectId/invite` - Invite additional students
- `POST /api/projects/:projectId/move-student` - Move a student between teams
- `POST /api/projects/:projectId/auto-assign-stragglers` - Auto-assign unassigned students
- `GET /api/projects/:projectId/teams` - Get teams for a specific project
- `GET /api/projects/:projectId/peer-reviews` - Get peer reviews for a project
- `GET /api/projects/:projectId/peer-reviews/student/:studentId` - Get reviews for a student
- `GET /api/projects/:projectId/team-members/:studentId` - Get team members for a student

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:teamId` - Update team name/description
- `PUT /api/teams/:teamId/details` - Update team details and lock status
- `POST /api/teams/:teamId/members` - Add student to team
- `DELETE /api/teams/:teamId/members/:studentId` - Remove student from team
- `POST /api/teams/auto-generate` - Automatically generate balanced teams

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create a new course

### Peer Reviews
- `POST /api/peer-reviews` - Submit a peer review

## Database Schema

The application uses the following main entities:

### Core Models
- **Student**: User information with skills, availability, and interests
  - `id`, `name`, `email`, `password`, `major`, `year`
  - `skills` (JSON string), `availability` (JSON string), `interests`
  - `createdAt`, `updatedAt`

- **Team**: Team information with capacity limits and project association
  - `id`, `name`, `description`, `maxMembers`, `teamNumber`
  - `locked` (boolean), `projectId` (optional)
  - `createdAt`, `updatedAt`

- **TeamMember**: Junction table linking students to teams
  - `id`, `studentId`, `teamId`, `role` (leader/member)
  - Unique constraint on `[studentId, teamId]`

### Instructor & Project Models
- **Instructor**: Instructor information and project management
  - `id`, `name`, `email`, `password`
  - `createdAt`, `updatedAt`

- **Project**: Project definition with team constraints
  - `id`, `name`, `description`, `minTeamSize`, `maxTeamSize`
  - `studentEmails` (JSON string), `status` (active/completed/cancelled)
  - `instructorId`, `courseId` (optional)
  - `createdAt`, `updatedAt`

- **Course**: Course organization for projects
  - `id`, `name`
  - `createdAt`, `updatedAt`

### Peer Review System
- **PeerReview**: Reviews between students within a project
  - `id`, `reviewerId`, `revieweeId`, `projectId`
  - `reviewText`
  - `createdAt`, `updatedAt`
  - Unique constraint on `[reviewerId, revieweeId, projectId]`

### Relationships
- **Instructor** → **Project** (one-to-many)
- **Course** → **Project** (one-to-many)
- **Project** → **Team** (one-to-many)
- **Project** → **PeerReview** (one-to-many)
- **Student** → **TeamMember** (one-to-many)
- **Team** → **TeamMember** (one-to-many)
- **Student** → **PeerReview** (as reviewer and reviewee)

## Database Tools

- **Database Studio**: `npm run db:studio` - Opens Prisma Studio for database management
- **Database Reset**: `npm run db:setup` - Regenerates Prisma client and pushes schema
