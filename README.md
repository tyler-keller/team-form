# Student Team Creation Tool

A full-stack application for creating and managing student teams with React frontend, Express backend, and SQLite database.

## Project Structure

```
team-form/
├── frontend/          # React frontend with Vite
├── backend/           # Express backend with Prisma
├── package.json       # Root package.json with scripts
└── README.md
```

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Express.js + Node.js
- **Database**: SQLite with Prisma ORM
- **Styling**: CSS3 with modern design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up the database:
```bash
npm run db:setup
```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Production

Build the frontend:
```bash
npm run build:frontend
```

Start the backend:
```bash
npm run start:backend
```

## API Endpoints

### Core Endpoints
- `GET /api/hello` - Hello world endpoint
- `GET /api/health` - Health check

### Student Management
- `GET /api/students` - Get all students with team memberships
- `POST /api/students` - Create a new student profile
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "major": "Computer Science",
    "year": "Junior",
    "skills": ["JavaScript", "React", "Python"],
    "interests": "Web development and AI",
    "availability": {
      "Monday": {"9:00 AM": true, "10:00 AM": true},
      "Wednesday": {"2:00 PM": true, "3:00 PM": true}
    }
  }
  ```

### Team Management
- `GET /api/teams` - Get all teams with members and project info
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:teamId` - Update team name and description
- `POST /api/teams/:teamId/members` - Add student to team
- `DELETE /api/teams/:teamId/members/:studentId` - Remove student from team
- `GET /api/projects/:projectId/teams` - Get teams for specific project

### Auto-Generate Teams
- `POST /api/teams/auto-generate` - Automatically generate balanced teams
  ```json
  {
    "teamSize": 4,
    "maxTeams": 10
  }
  ```

### Instructor Management
- `GET /api/instructors` - Get all instructors with projects
- `POST /api/instructors` - Create a new instructor
  ```json
  {
    "name": "Dr. Smith",
    "email": "dr.smith@university.edu"
  }
  ```

### Project Management
- `GET /api/projects` - Get all projects with teams and members
- `GET /api/projects/:id` - Get specific project with details
- `POST /api/projects` - Create a new project with automatic team generation
  ```json
  {
    "name": "Web Development Project",
    "description": "Build a full-stack web application",
    "minTeamSize": 3,
    "maxTeamSize": 4,
    "studentEmails": ["student1@example.com", "student2@example.com"],
    "instructorId": 1
  }
  ```

## Database Schema

The application uses the following main entities:

### Core Models
- **Student**: User information with skills, availability, and interests
  - `id`, `name`, `email`, `major`, `year`
  - `skills` (JSON string), `availability` (JSON string), `interests`
  - `createdAt`, `updatedAt`

- **Team**: Team information with capacity limits and project association
  - `id`, `name`, `description`, `maxMembers`, `teamNumber`
  - `projectId` (optional), `createdAt`, `updatedAt`

- **TeamMember**: Junction table linking students to teams
  - `id`, `studentId`, `teamId`, `role` (leader/member)
  - Unique constraint on `[studentId, teamId]`

### Instructor & Project Models
- **Instructor**: Instructor information and project management
  - `id`, `name`, `email`, `createdAt`, `updatedAt`

- **Project**: Project definition with team constraints
  - `id`, `name`, `description`, `minTeamSize`, `maxTeamSize`
  - `studentEmails` (JSON string), `status` (active/completed/cancelled)
  - `instructorId`, `createdAt`, `updatedAt`

### Relationships
- **Instructor** → **Project** (one-to-many)
- **Project** → **Team** (one-to-many)
- **Student** → **TeamMember** (one-to-many)
- **Team** → **TeamMember** (one-to-many)

## Development Tools

- **Database Studio**: `npm run db:studio` - Opens Prisma Studio for database management
- **Database Reset**: `npm run db:setup` - Regenerates Prisma client and pushes schema

## Features

### ✅ Core Features
- **Backend/Frontend Connection Test** - Health check and API connectivity
- **Student Profile Management** - Complete student profiles with skills and availability
- **Team Creation & Management** - Manual and automatic team formation
- **Team Member Management** - Join/leave teams, role assignment
- **Auto-Generate Teams** - Intelligent team formation with skill balancing

### ✅ Advanced Features
- **Instructor Dashboard** - Project creation and team oversight
- **Student Invitations** - Email-based team joining workflow
- **Project Management** - Multi-project support with team constraints
- **Smart Matching Algorithm** - Skills and availability-based team balancing
- **Real-time Updates** - Live team member counts and status

### ✅ User Workflows

#### Instructor Workflow
1. **Create Instructor Profile** - Add instructor information
2. **Create Project** - Define project with student emails and team constraints
3. **Automatic Team Generation** - System creates empty teams with sequential numbering
4. **Email Invitations** - Mock emails sent to all students with invitation links
5. **Monitor Progress** - Track team formation and student participation

#### Student Workflow
1. **Receive Invitation** - Click email link with project ID and student email
2. **Complete Profile** - Fill out student profile with skills and availability
3. **Browse Teams** - View available teams with member counts and descriptions
4. **Join Team** - Select and join a team or create new team
5. **Manage Team** - Edit team name/description, leave team if needed

### ✅ Technical Features
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Validation** - Prevents overfilling teams and duplicate memberships
- **Project Isolation** - Students can only join one team per project
- **Data Persistence** - SQLite database with Prisma ORM
- **Mock Email System** - Simulated email invitations with proper URLs
- **Smart Routing** - Automatic navigation based on URL parameters

## Usage Examples

### Create a Project
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Development Project",
    "description": "Build a full-stack web application",
    "minTeamSize": 3,
    "maxTeamSize": 4,
    "studentEmails": ["student1@example.com", "student2@example.com"],
    "instructorId": 1
  }'
```

### Auto-Generate Teams
```bash
curl -X POST http://localhost:3001/api/teams/auto-generate \
  -H "Content-Type: application/json" \
  -d '{
    "teamSize": 4,
    "maxTeams": 5
  }'
```

### Student Invitation URL
```
http://localhost:3000/join?project=1&email=student@example.com
```


### TODO:
- better UI across the board
- fix the duplicated students in multiple teams bug
- update time availability:
```
change the time availability UI:
- min time should be 9:00am
- max time should be 8:00pm
- vertical axis should be the times
- horizontal axis should be the days of the week (assume monday through friday)
```
