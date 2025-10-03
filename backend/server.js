const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Hello world route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the team creation backend!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Student routes
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        teamMemberships: {
          include: {
            team: true
          }
        }
      }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, email, major, year, skills, availability, interests } = req.body;
    const student = await prisma.student.create({
      data: {
        name,
        email,
        major,
        year,
        skills: skills ? JSON.stringify(skills) : null,
        availability: availability ? JSON.stringify(availability) : null,
        interests
      }
    });
    res.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Team routes
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            student: true
          }
        }
      }
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { name, description, maxMembers } = req.body;
    const team = await prisma.team.create({
      data: {
        name,
        description,
        maxMembers: maxMembers || 4
      }
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Add student to team
app.post('/api/teams/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { studentId, role } = req.body;
    
    const teamMember = await prisma.teamMember.create({
      data: {
        studentId: parseInt(studentId),
        teamId: parseInt(teamId),
        role
      },
      include: {
        student: true,
        team: true
      }
    });
    res.json(teamMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add student to team' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
