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

// Update an existing student profile by id
app.put('/api/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, major, year, skills, availability, interests } = req.body;

    const existing = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });
    if (!existing) return res.status(404).json({ error: 'Student not found' });

    const updated = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(major !== undefined ? { major } : {}),
        ...(year !== undefined ? { year } : {}),
        ...(skills !== undefined ? { skills: skills ? JSON.stringify(skills) : null } : {}),
        ...(availability !== undefined ? { availability: availability ? JSON.stringify(availability) : null } : {}),
        ...(interests !== undefined ? { interests } : {})
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Instructor routes
app.post('/api/instructors', async (req, res) => {
  try {
    const { name, email } = req.body;
    const instructor = await prisma.instructor.create({
      data: { name, email }
    });
    res.json(instructor);
  } catch (error) {
    console.error('Error creating instructor:', error);
    res.status(500).json({ error: 'Failed to create instructor' });
  }
});

app.get('/api/instructors', async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        projects: {
          include: {
            teams: {
              include: {
                members: {
                  include: {
                    student: true
                  }
                }
              }
            }
          }
        }
      }
    });
    res.json(instructors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
});

// Project routes
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, minTeamSize, maxTeamSize, studentEmails, instructorId, courseId, courseName } = req.body;
    
    // Ensure course: allow selecting existing by id or creating by name
    let resolvedCourseId = null;
    if (courseId) {
      resolvedCourseId = parseInt(courseId);
    } else if (courseName && courseName.trim().length > 0) {
      const upserted = await prisma.course.upsert({
        where: { name: courseName.trim() },
        update: {},
        create: { name: courseName.trim() }
      });
      resolvedCourseId = upserted.id;
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        minTeamSize,
        maxTeamSize,
        studentEmails: JSON.stringify(studentEmails),
        instructorId: parseInt(instructorId),
        courseId: resolvedCourseId || null
      }
    });
    
    // Calculate number of teams needed
    const totalStudents = studentEmails.length;
    const numTeams = Math.floor(totalStudents / minTeamSize);
    
    // Create empty teams
    const teams = [];
    for (let i = 1; i <= numTeams; i++) {
      const team = await prisma.team.create({
        data: {
          name: `Team ${i}`,
          description: '',
          maxMembers: maxTeamSize,
          teamNumber: i,
          projectId: project.id
        }
      });
      teams.push(team);
    }
    
    // Mock email sending
    console.log(`📧 Sending invitation emails to ${studentEmails.length} students for project: ${project.name}`);
    studentEmails.forEach((email, index) => {
      console.log(`📧 Email ${index + 1}: ${email}`);
      console.log(`   Subject: Join Team Formation for "${project.name}"`);
      console.log(`   Body: Please complete your profile and join a team at: http://localhost:3000/join?project=${project.id}&email=${encodeURIComponent(email)}`);
      console.log(`   ---`);
    });
    
    const completeProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        instructor: true,
        course: true,
        teams: true
      }
    });
    
    res.json({
      project: completeProject,
      teamsCreated: teams.length,
      emailsSent: studentEmails.length
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const { instructorEmail } = req.query;
    const where = instructorEmail
      ? { instructor: { email: String(instructorEmail) } }
      : undefined;
    const projects = await prisma.project.findMany({
      where,
      include: {
        instructor: true,
        course: true,
        teams: {
          include: {
            members: {
              include: {
                student: true
              }
            }
          }
        }
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        instructor: true,
        course: true,
        teams: {
          include: {
            members: {
              include: {
                student: true
              }
            }
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get all students relevant to a project: invited list and assigned/available
app.get('/api/projects/:projectId/students', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: parseInt(projectId) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const invitedEmails = JSON.parse(project.studentEmails);
    const students = await prisma.student.findMany({ where: { email: { in: invitedEmails } } });

    // Determine assignments
    const teams = await prisma.team.findMany({
      where: { projectId: parseInt(projectId) },
      include: { members: true }
    });

    const assignments = {};
    teams.forEach(team => {
      team.members.forEach(m => { assignments[m.studentId] = team.id; })
    });

    const enriched = students.map(s => ({
      ...s,
      teamId: assignments[s.id] || null
    }));

    res.json({
      students: enriched,
      teams: teams.map(t => ({ id: t.id, name: t.name, maxMembers: t.maxMembers })),
      invitedEmails
    });
  } catch (error) {
    console.error('Failed to fetch project students', error);
    res.status(500).json({ error: 'Failed to fetch project students' });
  }
});

// Move a student between teams (or to unassigned if teamId is null)
app.post('/api/projects/:projectId/move-student', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { studentId, toTeamId } = req.body;

    // Remove from any team in this project
    const memberships = await prisma.teamMember.findMany({
      where: { studentId: parseInt(studentId), team: { projectId: parseInt(projectId) } }
    });
    if (memberships.length > 0) {
      await prisma.teamMember.deleteMany({ where: { id: { in: memberships.map(m => m.id) } } });
    }

    // If moving to a team, add
    if (toTeamId) {
      // Check team capacity
      const team = await prisma.team.findUnique({ where: { id: parseInt(toTeamId) }, include: { members: true } });
      if (!team) return res.status(404).json({ error: 'Team not found' });
      if (team.members.length >= team.maxMembers) return res.status(400).json({ error: 'Team is full' });

      const member = await prisma.teamMember.create({ data: { studentId: parseInt(studentId), teamId: parseInt(toTeamId) } });
      return res.json(member);
    }

    res.json({ message: 'Student unassigned' });
  } catch (error) {
    console.error('Failed to move student', error);
    res.status(500).json({ error: 'Failed to move student' });
  }
});

// Auto-assign stragglers (students not in any team for this project)
app.post('/api/projects/:projectId/auto-assign-stragglers', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ where: { id: parseInt(projectId) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const invitedEmails = JSON.parse(project.studentEmails);
    const students = await prisma.student.findMany({ where: { email: { in: invitedEmails } } });
    const teams = await prisma.team.findMany({ where: { projectId: parseInt(projectId) }, include: { members: true } });

    const assignedIds = new Set(teams.flatMap(t => t.members.map(m => m.studentId)));
    const unassigned = students.filter(s => !assignedIds.has(s.id));

    // Fill teams greedily by capacity
    const updates = [];
    for (const s of unassigned) {
      const target = teams.find(t => t.members.length < t.maxMembers);
      if (!target) break;
      const newMember = await prisma.teamMember.create({ data: { studentId: s.id, teamId: target.id } });
      updates.push(newMember);
      // Reflect local members length
      const teamRef = teams.find(t => t.id === target.id);
      if (teamRef) teamRef.members.push({ studentId: s.id });
    }

    res.json({ assigned: updates.length });
  } catch (error) {
    console.error('Failed to auto-assign stragglers', error);
    res.status(500).json({ error: 'Failed to auto-assign stragglers' });
  }
});

// Edit project details
app.put('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, minTeamSize, maxTeamSize, status, courseId, courseName } = req.body;

    let resolvedCourseId = undefined;
    if (courseId !== undefined) {
      resolvedCourseId = courseId === null ? null : parseInt(courseId);
    } else if (courseName) {
      const upserted = await prisma.course.upsert({
        where: { name: courseName.trim() },
        update: {},
        create: { name: courseName.trim() }
      });
      resolvedCourseId = upserted.id;
    }

    const updated = await prisma.project.update({
      where: { id: parseInt(projectId) },
      data: {
        name, description,
        minTeamSize, maxTeamSize,
        status,
        courseId: resolvedCourseId
      },
      include: { instructor: true, course: true }
    });

    // If maxTeamSize provided, propagate to all teams in this project
    if (typeof maxTeamSize === 'number' && !Number.isNaN(maxTeamSize)) {
      await prisma.team.updateMany({
        where: { projectId: parseInt(projectId) },
        data: { maxMembers: maxTeamSize }
      });
    }
    res.json(updated);
  } catch (error) {
    console.error('Failed to update project', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Edit team details and lock
app.put('/api/teams/:teamId/details', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, locked } = req.body;
    const updated = await prisma.team.update({
      where: { id: parseInt(teamId) },
      data: { name, description, locked },
      include: { members: { include: { student: true } }, project: true }
    });
    res.json(updated);
  } catch (error) {
    console.error('Failed to update team details', error);
    res.status(500).json({ error: 'Failed to update team details' });
  }
});

// Invite additional students to a project (append emails)
app.post('/api/projects/:projectId/invite', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { emails } = req.body; // array of emails
    if (!Array.isArray(emails) || emails.length === 0) return res.status(400).json({ error: 'Emails required' });

    const project = await prisma.project.findUnique({ where: { id: parseInt(projectId) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = JSON.parse(project.studentEmails);
    const merged = Array.from(new Set([...existing, ...emails.map(e => e.trim()).filter(Boolean)]));

    const updated = await prisma.project.update({ where: { id: parseInt(projectId) }, data: { studentEmails: JSON.stringify(merged) } });

    // Mock email sending similar to creation
    console.log(`📧 Sending additional invitations to ${emails.length} students for project: ${updated.name}`);
    emails.forEach((email, idx) => {
      console.log(`📧 Email ${idx + 1}: ${email}`);
      console.log(`   Subject: Join Team Formation for "${updated.name}"`);
      console.log(`   Body: Please complete your profile and join a team at: http://localhost:3000/join?project=${updated.id}&email=${encodeURIComponent(email)}`);
      console.log(`   ---`);
    });

    res.json({ project: updated, invited: emails.length });
  } catch (error) {
    console.error('Failed to invite students', error);
    res.status(500).json({ error: 'Failed to invite students' });
  }
});

// Courses routes
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ orderBy: { name: 'asc' } });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Course name required' });
    const course = await prisma.course.create({ data: { name: name.trim() } });
    res.json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
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
        },
        project: true
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
    
    // Check if team is full
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
      include: { members: true }
    });
    
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ error: 'Team is full' });
    }
    
    // Check if student is already in a team for this project
    if (team.projectId) {
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          studentId: parseInt(studentId),
          team: {
            projectId: team.projectId
          }
        }
      });
      
      if (existingMembership) {
        return res.status(400).json({ error: 'Student is already in a team for this project' });
      }
    }
    
    const teamMember = await prisma.teamMember.create({
      data: {
        studentId: parseInt(studentId),
        teamId: parseInt(teamId),
        role
      },
      include: {
        student: true,
        team: {
          include: {
            project: true
          }
        }
      }
    });
    res.json(teamMember);
  } catch (error) {
    console.error('Error adding student to team:', error);
    res.status(500).json({ error: 'Failed to add student to team' });
  }
});

// Update team details
app.put('/api/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, maxMembers } = req.body;

    // Load team with current members and project constraints
    const existing = await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
      include: { members: true, project: true }
    });
    if (!existing) return res.status(404).json({ error: 'Team not found' });

    const currentMemberCount = existing.members.length;

    // Validate maxMembers if provided (could be 0/undefined)
    let validatedMaxMembers = undefined;
    if (maxMembers !== undefined) {
      const proposed = parseInt(maxMembers);
      if (Number.isNaN(proposed) || proposed <= 0) {
        return res.status(400).json({ error: 'Invalid team size' });
      }

      // Enforce bounds: project min/max if associated
      if (existing.project) {
        const minAllowed = existing.project.minTeamSize;
        const maxAllowed = existing.project.maxTeamSize;
        if (proposed < minAllowed) {
          return res.status(400).json({ error: `Team size cannot be less than project minimum (${minAllowed})` });
        }
        if (proposed > maxAllowed) {
          return res.status(400).json({ error: `Team size cannot exceed project maximum (${maxAllowed})` });
        }
      }

      // Must accommodate current members
      if (proposed < currentMemberCount) {
        return res.status(400).json({ error: `Team size cannot be less than current members (${currentMemberCount})` });
      }

      validatedMaxMembers = proposed;
    }

    const data = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(validatedMaxMembers !== undefined ? { maxMembers: validatedMaxMembers } : {})
    };

    const team = await prisma.team.update({
      where: { id: parseInt(teamId) },
      data,
      include: {
        members: { include: { student: true } },
        project: true
      }
    });

    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Get teams for a specific project
app.get('/api/projects/:projectId/teams', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const teams = await prisma.team.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        members: {
          include: {
            student: true
          }
        },
        project: true
      },
      orderBy: { teamNumber: 'asc' }
    });
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching project teams:', error);
    res.status(500).json({ error: 'Failed to fetch project teams' });
  }
});

// Remove student from team
app.delete('/api/teams/:teamId/members/:studentId', async (req, res) => {
  try {
    const { teamId, studentId } = req.params;
    
    await prisma.teamMember.deleteMany({
      where: {
        teamId: parseInt(teamId),
        studentId: parseInt(studentId)
      }
    });
    
    res.json({ message: 'Student removed from team' });
  } catch (error) {
    console.error('Error removing student from team:', error);
    res.status(500).json({ error: 'Failed to remove student from team' });
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
          description: ''
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
