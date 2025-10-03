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

// Auto-generate teams
app.post('/api/teams/auto-generate', async (req, res) => {
  try {
    const { teamSize = 4, maxTeams = 10 } = req.body;
    
    // Fetch all students
    const students = await prisma.student.findMany();
    
    if (students.length === 0) {
      return res.status(400).json({ error: 'No students available for team generation' });
    }
    
    // Parse skills and availability for each student
    const studentsWithData = students.map(student => ({
      ...student,
      skillsArray: student.skills ? JSON.parse(student.skills) : [],
      availabilityObject: student.availability ? JSON.parse(student.availability) : {}
    }));
    
    // Generate teams using matching algorithm
    const generatedTeams = generateTeams(studentsWithData, teamSize, maxTeams);
    
    // Save teams to database
    const savedTeams = [];
    for (const team of generatedTeams) {
      const teamData = await prisma.team.create({
        data: {
          name: team.name,
          description: team.description
        }
      });
      
      // Add team members
      for (let i = 0; i < team.members.length; i++) {
        const member = team.members[i];
        await prisma.teamMember.create({
          data: {
            studentId: member.id,
            teamId: teamData.id,
            role: i === 0 ? 'leader' : 'member'
          }
        });
      }
      
      // Fetch the complete team with members
      const completeTeam = await prisma.team.findUnique({
        where: { id: teamData.id },
        include: {
          members: {
            include: {
              student: true
            }
          }
        }
      });
      
      savedTeams.push(completeTeam);
    }
    
    res.json({
      message: `Successfully generated ${savedTeams.length} teams`,
      teams: savedTeams
    });
    
  } catch (error) {
    console.error('Error auto-generating teams:', error);
    res.status(500).json({ error: 'Failed to auto-generate teams' });
  }
});

// Team generation algorithm
function generateTeams(students, teamSize, maxTeams) {
  const teams = [];
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  
  // Calculate total teams needed
  const totalTeams = Math.min(
    Math.ceil(students.length / teamSize),
    maxTeams
  );
  
  // Group students into teams
  for (let i = 0; i < totalTeams; i++) {
    const startIndex = i * teamSize;
    const endIndex = Math.min(startIndex + teamSize, students.length);
    const teamMembers = shuffledStudents.slice(startIndex, endIndex);
    
    if (teamMembers.length === 0) break;
    
    // Calculate team statistics
    const teamStats = calculateTeamStats(teamMembers);
    
    const team = {
      name: `Team ${i + 1}`,
      description: `Auto-generated team with ${teamMembers.length} members. Skills: ${teamStats.skills.join(', ')}`,
      members: teamMembers,
      stats: teamStats
    };
    
    teams.push(team);
  }
  
  // Try to balance teams by swapping members
  return balanceTeams(teams);
}

function calculateTeamStats(members) {
  const allSkills = members.flatMap(member => member.skillsArray);
  const skillCounts = {};
  allSkills.forEach(skill => {
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  });
  
  const uniqueSkills = Object.keys(skillCounts);
  const availabilityScore = calculateAvailabilityScore(members);
  
  return {
    skills: uniqueSkills,
    skillCounts,
    availabilityScore,
    memberCount: members.length
  };
}

function calculateAvailabilityScore(members) {
  // Simple availability scoring based on number of available time slots
  let totalSlots = 0;
  let availableSlots = 0;
  
  members.forEach(member => {
    const availability = member.availabilityObject;
    Object.values(availability).forEach(daySlots => {
      Object.values(daySlots).forEach(isAvailable => {
        totalSlots++;
        if (isAvailable) availableSlots++;
      });
    });
  });
  
  return totalSlots > 0 ? availableSlots / totalSlots : 0;
}

function balanceTeams(teams) {
  // Simple balancing: try to ensure each team has a good mix of skills
  const maxIterations = 3;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let improved = false;
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Try swapping members to improve balance
        for (let k = 0; k < team1.members.length; k++) {
          for (let l = 0; l < team2.members.length; l++) {
            const member1 = team1.members[k];
            const member2 = team2.members[l];
            
            // Calculate scores before and after swap
            const beforeScore = calculateTeamBalanceScore([team1, team2]);
            
            // Swap members
            [team1.members[k], team2.members[l]] = [team2.members[l], team1.members[k]];
            
            // Recalculate team stats
            team1.stats = calculateTeamStats(team1.members);
            team2.stats = calculateTeamStats(team2.members);
            
            const afterScore = calculateTeamBalanceScore([team1, team2]);
            
            // If swap didn't improve balance, swap back
            if (afterScore <= beforeScore) {
              [team1.members[k], team2.members[l]] = [team2.members[l], team1.members[k]];
              team1.stats = calculateTeamStats(team1.members);
              team2.stats = calculateTeamStats(team2.members);
            } else {
              improved = true;
            }
          }
        }
      }
    }
    
    if (!improved) break;
  }
  
  return teams;
}

function calculateTeamBalanceScore(teams) {
  // Calculate how balanced the teams are
  const skillDiversity = teams.reduce((sum, team) => {
    return sum + team.stats.skills.length;
  }, 0);
  
  const availabilityBalance = teams.reduce((sum, team) => {
    return sum + team.stats.availabilityScore;
  }, 0);
  
  return skillDiversity + availabilityBalance;
}

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
