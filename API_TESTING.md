# API Testing Examples

Quick curl commands for testing the API directly (useful for debugging).

## Prerequisites

Make sure the backend is running:
```bash
cd backend
npm run dev
```

Base URL: `http://localhost:3001`

---

## Health Check

```bash
# Simple health check
curl http://localhost:3001/api/health

# Hello world
curl http://localhost:3001/api/hello
```

---

## Instructors

### Create Instructor
```bash
curl -X POST http://localhost:3001/api/instructors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test Instructor",
    "email": "test.instructor@university.edu"
  }'
```

### Get All Instructors
```bash
curl http://localhost:3001/api/instructors
```

---

## Courses

### Create Course
```bash
curl -X POST http://localhost:3001/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CS 999 - Test Course"
  }'
```

### Get All Courses
```bash
curl http://localhost:3001/api/courses
```

---

## Students

### Create Student
```bash
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test.student@student.edu",
    "major": "Computer Science",
    "year": "Junior",
    "skills": ["JavaScript", "Python", "React"],
    "interests": "Web development and AI",
    "availability": {
      "Monday": ["Afternoon", "Evening"],
      "Wednesday": ["Morning"]
    }
  }'
```

### Get All Students
```bash
curl http://localhost:3001/api/students
```

### Get Student by Email
```bash
curl "http://localhost:3001/api/students/by-email?email=test.student@student.edu"
```

### Update Student
```bash
curl -X PUT http://localhost:3001/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "major": "Data Science",
    "skills": ["Python", "TensorFlow", "SQL"]
  }'
```

---

## Projects

### Create Project
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "A test project for API testing",
    "minTeamSize": 2,
    "maxTeamSize": 4,
    "studentEmails": [
      "alice.thompson@student.edu",
      "bob.martinez@student.edu",
      "carol.chen@student.edu"
    ],
    "instructorId": 1
  }'
```

Note: This automatically creates empty teams based on the min/max team size.

### Get All Projects
```bash
curl http://localhost:3001/api/projects
```

### Get Project by ID
```bash
curl http://localhost:3001/api/projects/1
```

### Get Project by Instructor Email
```bash
curl "http://localhost:3001/api/projects/by-instructor?email=jane.smith@university.edu"
```

---

## Teams

### Create Team Manually
```bash
curl -X POST http://localhost:3001/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Team",
    "description": "A manually created test team",
    "maxMembers": 4,
    "projectId": 1
  }'
```

### Get All Teams
```bash
curl http://localhost:3001/api/teams
```

### Get Teams for Project
```bash
curl http://localhost:3001/api/projects/1/teams
```

### Update Team
```bash
curl -X PUT http://localhost:3001/api/teams/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Team Name",
    "description": "Updated description"
  }'
```

### Add Student to Team
```bash
curl -X POST http://localhost:3001/api/teams/1/members \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1
  }'
```

### Remove Student from Team
```bash
curl -X DELETE http://localhost:3001/api/teams/1/members/1
```

### Get Available Teams for Student
```bash
curl "http://localhost:3001/api/teams/available?projectId=1&studentEmail=test.student@student.edu"
```

---

## Auto-Generate Teams

### Generate Teams (Legacy - no project association)
```bash
curl -X POST http://localhost:3001/api/teams/auto-generate \
  -H "Content-Type: application/json" \
  -d '{
    "teamSize": 4,
    "maxTeams": 3
  }'
```

Note: This is the older endpoint. New projects automatically create teams.

---

## Testing Complete Workflow

### 1. Quick Setup with CLI
```bash
cd backend
npm run quick-setup
```

### 2. Verify Data
```bash
# Check instructors
curl http://localhost:3001/api/instructors | jq

# Check projects
curl http://localhost:3001/api/projects | jq

# Check students
curl http://localhost:3001/api/students | jq

# Check teams
curl http://localhost:3001/api/teams | jq
```

### 3. Simulate Student Joining Team
```bash
# Get available teams for a student
curl "http://localhost:3001/api/teams/available?projectId=1&studentEmail=alice.thompson@student.edu" | jq

# Add student to team 1
curl -X POST http://localhost:3001/api/teams/1/members \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1}'

# Verify
curl http://localhost:3001/api/teams/1 | jq
```

---

## Using jq for Pretty Output

If you have `jq` installed (recommended), pipe responses through it for pretty printing:

```bash
curl http://localhost:3001/api/projects | jq
```

Install jq:
- Mac: `brew install jq`
- Linux: `sudo apt-get install jq`
- Windows: Download from https://stedolan.github.io/jq/

---

## Troubleshooting

### "Cannot connect to server"
Make sure backend is running:
```bash
cd backend
npm run dev
```

### "404 Not Found"
Check the endpoint URL and method (GET, POST, PUT, DELETE)

### "400 Bad Request"
Check your JSON syntax and required fields

### "500 Internal Server Error"
Check backend console logs for error details

---

## Advanced Testing

### Test Project with Course
```bash
# Create course
COURSE_ID=$(curl -s -X POST http://localhost:3001/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "CS 888 - API Testing"}' | jq -r '.id')

# Create instructor
INSTRUCTOR_ID=$(curl -s -X POST http://localhost:3001/api/instructors \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. API Test", "email": "api.test@university.edu"}' | jq -r '.id')

# Create project with course
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"API Test Project\",
    \"description\": \"Created via API\",
    \"minTeamSize\": 2,
    \"maxTeamSize\": 3,
    \"studentEmails\": [],
    \"instructorId\": $INSTRUCTOR_ID,
    \"courseId\": $COURSE_ID
  }" | jq
```

### Clean Up Test Data
```bash
cd backend
npm run db:reset
```
