# Developer Tooling Guide

This document describes the developer tools available for quickly setting up test data without using the web interface.

## Quick Start

The fastest way to get started with sample data:

```bash
cd backend
npm run quick-setup
```

This creates a complete working environment with 1 instructor, 1 course, 1 project, and 12 students in seconds.

## Available Developer Tools

### 1. 🚀 Quick Setup (Recommended for Getting Started)

**Command:** `npm run quick-setup`

**What it does:**
- Creates 1 instructor (Dr. Jane Smith)
- Creates 1 course (CS 499 - Senior Project)
- Creates 1 project (AI-Powered Study Assistant)
- Creates 12 students with realistic profiles
- Assigns all students to the project

**Use when:** You want to start testing immediately with a working example.

```bash
cd backend
npm run quick-setup
```

### 2. 🌱 Database Seed (For Comprehensive Testing)

**Command:** `npm run seed`

**What it does:**
- ⚠️ **CLEARS ALL EXISTING DATA**
- Creates 4 instructors
- Creates 5 courses
- Creates 4 different projects
- Creates 50 students with randomized:
  - Names (from pool of 40 first names × 40 last names)
  - Majors (10 different majors)
  - Skills (from 20+ available skills)
  - Interests (from 15+ interest areas)
  - Availability schedules
- Distributes students across projects

**Use when:** You want realistic scale testing with diverse data.

```bash
cd backend
npm run seed
```

### 3. 🛠️ Interactive CLI (For Custom Data)

**Command:** `npm run cli`

**What it does:**
- Opens an interactive menu for creating data
- Allows precise control over what you create
- Supports bulk operations

**Use when:** You need specific test scenarios or want to add data to existing setup.

```bash
cd backend
npm run cli
```

**Available CLI Operations:**
1. Create Instructor
2. Create Course
3. Create Project (with instructor/course selection)
4. Create Student
5. Bulk Create Students (CSV-like format)
6. List Projects
7. List Students

#### Bulk Student Creation Format

When using option 5 in the CLI, use this format:

```
name,email,major,year,skills
```

Example input:
```
John Doe,john@student.edu,Computer Science,Junior,JavaScript;Python;React
Jane Smith,jane@student.edu,Data Science,Senior,Python;TensorFlow;SQL
Bob Jones,bob@student.edu,Software Engineering,Sophomore,Java;Spring;Docker
```

Skills are separated by semicolons (`;`).

### 4. 🔄 Database Reset (Nuclear Option)

**Command:** `npm run db:reset`

**What it does:**
- Deletes the entire database
- Recreates the schema
- Runs the full seed script

**Use when:** You want to start completely fresh with sample data.

```bash
cd backend
npm run db:reset
```

## Typical Workflows

### First Time Setup

```bash
# Navigate to backend
cd backend

# Ensure database is set up
npm run db:push

# Quick setup with sample data
npm run quick-setup

# Start the server
npm run dev
```

### Adding More Test Data

```bash
cd backend

# Option 1: Use interactive CLI
npm run cli
# Then select options from menu

# Option 2: Run full seed (replaces all data)
npm run seed
```

### Testing Different Scenarios

```bash
# Reset everything and seed fresh data
npm run db:reset

# Then add custom scenarios via CLI
npm run cli
```

### Viewing Data

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio
# Opens at http://localhost:5555
```

## Sample Data Details

### Quick Setup Data

The quick setup creates:

**Instructor:**
- Dr. Jane Smith (jane.smith@university.edu)

**Course:**
- CS 499 - Senior Project

**Project:**
- Name: AI-Powered Study Assistant
- Description: Build an intelligent study assistant that helps students organize notes, create study schedules, and generate practice questions
- Team Size: 3-5 members

**Students (12):**
1. Alice Thompson - React, Node.js, Python, MongoDB
2. Bob Martinez - Java, Spring Boot, Docker, AWS
3. Carol Chen - Python, TensorFlow, Pandas, SQL
4. David Kim - TypeScript, React, GraphQL, PostgreSQL
5. Eva Rodriguez - C++, Python, Embedded Systems, Git
6. Frank Lee - JavaScript, Vue.js, Firebase, UI/UX
7. Grace Wilson - Python, Django, PostgreSQL, REST APIs
8. Henry Patel - JavaScript, React Native, Node.js, MongoDB
9. Iris Zhang - R, Python, Tableau, Machine Learning
10. Jack Brown - Go, Docker, Kubernetes, Microservices
11. Kate Anderson - Python, Network Security, Penetration Testing
12. Leo Garcia - Swift, iOS Development, Firebase, SwiftUI

### Seed Script Data

The seed script creates a more diverse dataset:

**Instructors (4):**
- Dr. Sarah Chen
- Prof. Michael Rodriguez
- Dr. Emily Johnson
- Prof. David Kim

**Courses (5):**
- CS 101 - Introduction to Programming
- CS 301 - Software Engineering
- CS 401 - Advanced Full-Stack Development
- CS 450 - Machine Learning
- CS 350 - Database Systems

**Projects (4):**
1. E-Commerce Platform Development (20 students, Full-Stack)
2. Machine Learning Research Project (16 students, ML)
3. Mobile Health Tracking App (12 students, Software Engineering)
4. Database Design Challenge (15 students, Database Systems)

**Students (50):**
- Randomized names from 40 first names × 40 last names
- Random majors from 10 options
- Random skills (3-7 skills per student from 20+ options)
- Random interests (2-5 interests from 15+ options)
- Random availability schedules

## Modifying Sample Data

To customize the sample data, edit:

```
backend/scripts/sample-data.js
```

You can modify:
- `sampleInstructors` - Add/edit instructor profiles
- `sampleCourses` - Add/edit course names
- `sampleProjects` - Add/edit project templates
- Name pools, majors, skills, interests - Customize student generation

Example: Adding a new project template:

```javascript
sampleProjects.push({
  name: 'Blockchain Voting System',
  description: 'Create a secure voting system using blockchain technology',
  minTeamSize: 2,
  maxTeamSize: 4,
  instructorEmail: 'sarah.chen@university.edu',
  courseName: 'CS 450 - Machine Learning',
  studentStartIndex: 0,
  studentCount: 15,
  status: 'active'
});
```

## Script Locations

All scripts are in `backend/scripts/`:

- `quick-setup.js` - Quick setup script
- `seed.js` - Full database seed script
- `cli.js` - Interactive CLI tool
- `sample-data.js` - Sample data definitions
- `README.md` - Detailed script documentation

## Tips & Best Practices

1. **Use Quick Setup for Demos**: It's fast and creates a complete working example
2. **Use Seed for Testing at Scale**: Great for testing UI with many students/projects
3. **Use CLI for Specific Cases**: When you need exact test scenarios
4. **Use Prisma Studio to Verify**: Visual confirmation of what's in the database
5. **Commit Before Seeding**: If you have important data, back it up first

## Troubleshooting

### "Database does not exist"

```bash
cd backend
npm run db:push
```

### "Email already exists" errors

The scripts use `upsert` where possible, but if you get conflicts:

```bash
npm run db:reset
```

### Want to see what's in the database?

```bash
npm run db:studio
```

### Scripts not working?

Make sure you're in the backend directory:

```bash
cd backend
npm run quick-setup
```

## Integration with Web App

After running any of these scripts:

1. Start the backend (if not already running):
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

4. Use the instructor email from your setup to access projects:
   - Quick setup: `jane.smith@university.edu`
   - Seed: Various instructor emails (see output)

## Next Steps

After setting up your data, you might want to:

1. Test the student profile form with the generated student emails
2. Test team creation with different project configurations
3. Test the auto-generate teams feature
4. Modify sample data to match your specific testing needs

For more details on each script, see `backend/scripts/README.md`.
