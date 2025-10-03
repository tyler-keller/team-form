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

- `GET /api/hello` - Hello world endpoint
- `GET /api/health` - Health check
- `GET /api/students` - Get all students
- `POST /api/students` - Create a new student
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `POST /api/teams/:teamId/members` - Add student to team

## Database Schema

The application uses the following main entities:
- **Student**: User information with skills and preferences
- **Team**: Team information with capacity limits
- **TeamMember**: Junction table linking students to teams

## Development Tools

- **Database Studio**: `npm run db:studio` - Opens Prisma Studio for database management
- **Database Reset**: `npm run db:setup` - Regenerates Prisma client and pushes schema

## Features

- ✅ Backend/Frontend connection test
- 🔄 Student registration (coming soon)
- 🔄 Team creation (coming soon)
- 🔄 Team member management (coming soon)
- 🔄 Skill-based matching (coming soon)