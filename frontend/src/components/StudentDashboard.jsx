import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [student, setStudent] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null); // { project, team }
  const [editValues, setEditValues] = useState({ name: '', description: '', maxMembers: '' });
  const [editError, setEditError] = useState('');
  const [profileStudent, setProfileStudent] = useState(null); // student object
  const [unassignedStudents, setUnassignedStudents] = useState({}); // { projectId: [students] }
  const [invitations, setInvitations] = useState([]); // Array of invitations for current student
  const [invitingStudent, setInvitingStudent] = useState(null); // Student being invited (for context)
  const [expandedTeamAvailability, setExpandedTeamAvailability] = useState(new Set()); // Set of team IDs with expanded availability
  const navigate = useNavigate();

  useEffect(() => {
    // Get student email from localStorage or other auth context
    const email = localStorage.getItem('studentEmail');
    setStudentEmail(email);
    initialize(email);
  }, []);

  const initialize = async (email) => {
    try {
      setLoading(true);
      setError('');
      const [projectsResponse, studentsResponse] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/students')
      ]);

      const currentStudent = (studentsResponse.data || []).find(s => s.email === email) || null;
      setStudent(currentStudent || null);

      // Show projects where the student is invited (email in studentEmails) OR already in a team
      const filtered = (projectsResponse.data || []).filter(project => {
        // Check if student's email is in the project's invited emails list
        let isInvited = false;
        try {
          const invitedEmails = JSON.parse(project.studentEmails || '[]');
          isInvited = Array.isArray(invitedEmails) && invitedEmails.includes(email);
        } catch (e) {
          console.error('Error parsing studentEmails:', e);
        }
        
        // Check if student is already in a team for this project
        const isInTeam = project.teams?.some(team =>
          team.members?.some(member => member.student?.email === email)
        );
        
        return isInvited || isInTeam;
      });
      setProjects(filtered);

      // Fetch unassigned students for each project (excluding current student)
      const unassignedMap = {};
      await Promise.all(
        filtered.map(async (project) => {
          try {
            const rosterResponse = await axios.get(`/api/projects/${project.id}/students`);
            const unassigned = (rosterResponse.data.students || [])
              .filter(s => !s.teamId && s.email !== email); // Exclude current student
            unassignedMap[project.id] = unassigned;
          } catch (err) {
            console.error(`Error fetching students for project ${project.id}:`, err);
            unassignedMap[project.id] = [];
          }
        })
      );
      setUnassignedStudents(unassignedMap);

      // Fetch invitations for current student
      if (currentStudent) {
        try {
          const invitationsResponse = await axios.get(`/api/students/${currentStudent.id}/invitations?status=pending`);
          setInvitations(invitationsResponse.data || []);
        } catch (err) {
          console.error('Error fetching invitations:', err);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStudentCurrentTeamIdForProject = (project) => {
    if (!student) return null;
    for (const team of project.teams || []) {
      if ((team.members || []).some(m => m.studentId === student.id || m.student?.id === student.id)) {
        return team.id;
      }
    }
    return null;
  };

  const calculateTeamAvailability = (members) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = [
      '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
      '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
    ];

    const availabilityCount = {};
    let totalMembers = 0;

    members.forEach(member => {
      if (!member.student) return;
      totalMembers++;
      
      let memberAvailability = {};
      try {
        memberAvailability = member.student.availability
          ? (typeof member.student.availability === 'string'
              ? JSON.parse(member.student.availability)
              : member.student.availability)
          : {};
      } catch (e) {
        memberAvailability = {};
      }

      days.forEach(day => {
        timeSlots.forEach(timeSlot => {
          const key = `${day}-${timeSlot}`;
          if (!availabilityCount[key]) {
            availabilityCount[key] = 0;
          }
          if (memberAvailability[day]?.[timeSlot] === true) {
            availabilityCount[key]++;
          }
        });
      });
    });

    return { availabilityCount, totalMembers, days, timeSlots };
  };

  const handleJoinTeam = async (projectId, team) => {
    if (!student) {
      alert('Please complete your student profile before joining a team.');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    const currentTeamId = project ? getStudentCurrentTeamIdForProject(project) : null;

    if (currentTeamId === team.id) {
      // Already in this team; nothing to do
      return;
    }

    if ((team.members || []).length >= (team.maxMembers || 0)) {
      alert('Team is full');
      return;
    }

    let proceed = true;
    if (currentTeamId) {
      proceed = window.confirm('You are already in a team for this project. Do you want to leave your current team and join this one?');
    }

    if (!proceed) return;

    try {
      setLoading(true);
      await axios.post(`/api/projects/${projectId}/move-student`, {
        studentId: student.id,
        toTeamId: team.id
      });
      // refresh
      await initialize(studentEmail);
      alert('Successfully joined the team');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to join team';
      alert(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project, team) => {
    setEditError('');
    setEditingTeam({ project, team });
    setEditValues({
      name: team.name || '',
      description: team.description || '',
      maxMembers: String(team.maxMembers || '')
    });
  };

  const closeEditModal = () => {
    setEditingTeam(null);
    setEditValues({ name: '', description: '', maxMembers: '' });
    setEditError('');
  };

  const validateEdit = () => {
    if (!editingTeam) return 'No team selected';
    const { project, team } = editingTeam;
    const trimmedName = (editValues.name || '').trim();
    if (!trimmedName) return 'Team name is required';
    const proposed = parseInt(editValues.maxMembers, 10);
    if (Number.isNaN(proposed) || proposed <= 0) return 'Team size must be a positive integer';
    const currentCount = (team.members || []).length;
    if (proposed < currentCount) return `Team size cannot be less than current members (${currentCount})`;
    if (typeof project.minTeamSize === 'number' && proposed < project.minTeamSize) return `Must be ≥ project minimum (${project.minTeamSize})`;
    if (typeof project.maxTeamSize === 'number' && proposed > project.maxTeamSize) return `Must be ≤ project maximum (${project.maxTeamSize})`;
    return '';
  };

  const submitEdit = async (e) => {
    e?.preventDefault?.();
    const errMsg = validateEdit();
    if (errMsg) { setEditError(errMsg); return; }
    try {
      setLoading(true);
      setEditError('');
      const { team, project } = editingTeam;
      await axios.put(`/api/teams/${team.id}`, {
        name: editValues.name.trim(),
        description: editValues.description,
        maxMembers: parseInt(editValues.maxMembers, 10)
      });
      await initialize(studentEmail);
      closeEditModal();
      alert('Team updated');
    } catch (e2) {
      const msg = e2?.response?.data?.error || 'Failed to update team';
      setEditError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToTeam = async (invitedStudentId, projectId) => {
    if (!student) {
      alert('Please complete your student profile first.');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const currentTeamId = getStudentCurrentTeamIdForProject(project);
    if (!currentTeamId) {
      alert('You must be in a team to invite others.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/api/teams/${currentTeamId}/invite`, {
        studentId: invitedStudentId,
        inviterId: student.id
      });
      alert('Invitation sent!');
      setProfileStudent(null);
      setInvitingStudent(null);
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to send invitation';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitationId, status, invitation) => {
    if (status === 'accepted' && invitation?.team?.project) {
      // Check if student is already in a team for this project
      const project = projects.find(p => p.id === invitation.team.project.id);
      if (project) {
        const currentTeamId = getStudentCurrentTeamIdForProject(project);
        if (currentTeamId && currentTeamId !== invitation.team.id) {
          const currentTeam = project.teams?.find(t => t.id === currentTeamId);
          const newTeam = invitation.team;
          const proceed = window.confirm(
            `You are already in ${currentTeam?.name || 'a team'} for this project. ` +
            `Do you want to leave your current team and join ${newTeam?.name || 'this team'}?`
          );
          if (!proceed) {
            return;
          }
        }
      }
    }

    try {
      setLoading(true);
      await axios.put(`/api/invitations/${invitationId}/respond`, { status });
      await initialize(studentEmail);
      alert(status === 'accepted' ? 'Invitation accepted! You have joined the team.' : 'Invitation rejected.');
    } catch (error) {
      const msg = error?.response?.data?.error || `Failed to ${status} invitation`;
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-dashboard">
      <h2>Student Dashboard</h2>
      <button onClick={() => navigate('/edit-profile')} className="edit-profile-btn">Edit Profile</button>
      <h3>Your Projects</h3>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        projects.length > 0 ? (
          <div className="projects-list">
            {projects.map((project) => {
              const currentTeamId = getStudentCurrentTeamIdForProject(project);
              const isInvitedButNotInTeam = currentTeamId === null;
              // Filter invitations for this project
              const projectInvitations = invitations.filter(inv => 
                inv.team?.project?.id === project.id && inv.status === 'pending'
              );
              
              return (
                <div key={project.id} className="project-card">
                  <h4>{project.name}</h4>
                  {project.description ? <p>{project.description}</p> : null}
                  {isInvitedButNotInTeam && (
                    <div style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: '4px', 
                      marginBottom: '1rem',
                      border: '1px solid #90caf9'
                    }}>
                      <strong>You've been invited to this project.</strong> Please join a team below to participate.
                    </div>
                  )}

                  {/* Team Invitations for this Project */}
                  {projectInvitations.length > 0 && (
                    <div style={{
                      marginBottom: '1.5rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(255, 193, 7, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 193, 7, 0.3)'
                    }}>
                      <h5 style={{ 
                        color: '#f0f0f0', 
                        marginBottom: '0.75rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>🔔</span>
                        Team Invitations ({projectInvitations.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {projectInvitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            style={{
                              padding: '0.75rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            <div style={{ color: '#f0f0f0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                              <strong>{invitation.inviter?.name || invitation.inviter?.email}</strong> invited you to join{' '}
                              <strong>{invitation.team?.name || `Team ${invitation.team?.teamNumber || ''}`}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleRespondToInvitation(invitation.id, 'accepted', invitation)}
                                disabled={loading}
                                style={{
                                  backgroundColor: '#4CAF50',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '4px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontSize: '0.85rem',
                                  flex: 1
                                }}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespondToInvitation(invitation.id, 'rejected', invitation)}
                                disabled={loading}
                                style={{
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '4px',
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  fontSize: '0.85rem',
                                  flex: 1
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: unassignedStudents[project.id] && unassignedStudents[project.id].length > 0 
                      ? 'minmax(0, 1fr) minmax(250px, 300px)' 
                      : '1fr',
                    gap: '1.5rem',
                    alignItems: 'start'
                  }}
                  className="project-content-grid"
                  >
                    <div className="teams-section">
                      <h5>Teams</h5>
                      <div className="teams-grid">
                        {(project.teams || []).map(team => {
                          const members = team.members || [];
                          const isFull = members.length >= (team.maxMembers || 0);
                          const isCurrentTeam = currentTeamId === team.id;
                          return (
                            <div key={team.id} className="team-card">
                              <div className="team-header">
                                <strong>{team.name || `Team ${team.teamNumber || ''}`}</strong>
                                <span>
                                  {members.length}/{team.maxMembers} members
                                </span>
                              </div>
                              {team.description ? <p>{team.description}</p> : null}
                              <div className="team-members">
                                {(members).map(m => (
                                  <button
                                    key={m.id}
                                    className="member-row"
                                    onClick={() => setProfileStudent(m.student)}
                                    style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                                  >
                                    {m.student?.name || 'Student'}{m.student?.email ? ` (${m.student.email})` : ''}
                                  </button>
                                ))}
                                {members.length === 0 ? <div className="member-row">No members yet</div> : null}
                              </div>

                              {/* Team Availability Visualization */}
                              {members.length > 0 && (() => {
                                const { availabilityCount, totalMembers, days, timeSlots } = calculateTeamAvailability(members);
                                const isExpanded = expandedTeamAvailability.has(team.id);
                                
                                return (
                                  <div style={{ 
                                    marginTop: '1rem', 
                                    marginBottom: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                                  }}>
                                    <div style={{ 
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '0.5rem'
                                    }}>
                                      <div style={{ 
                                        fontSize: '0.85rem', 
                                        color: 'rgba(240, 240, 240, 0.8)', 
                                        fontWeight: 500
                                      }}>
                                        Team Availability
                                      </div>
                                      <button
                                        onClick={() => {
                                          const newExpanded = new Set(expandedTeamAvailability);
                                          if (isExpanded) {
                                            newExpanded.delete(team.id);
                                          } else {
                                            newExpanded.add(team.id);
                                          }
                                          setExpandedTeamAvailability(newExpanded);
                                        }}
                                        style={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                          color: '#f0f0f0',
                                          border: '1px solid rgba(255, 255, 255, 0.2)',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '0.75rem',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                      >
                                        {isExpanded ? '▼ Hide' : '▶ Show'}
                                      </button>
                                    </div>
                                    {isExpanded && (
                                      <div style={{
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        overflow: 'auto',
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)'
                                      }}>
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '50px repeat(7, 1fr)',
                                        gap: '1px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        padding: '1px',
                                        fontSize: '0.7rem'
                                      }}>
                                        {/* Header row */}
                                        <div style={{ 
                                          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                          padding: '0.25rem', 
                                          textAlign: 'center',
                                          position: 'sticky',
                                          left: 0,
                                          zIndex: 2
                                        }}></div>
                                        {days.map(day => (
                                          <div key={day} style={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                            padding: '0.25rem', 
                                            textAlign: 'center',
                                            fontSize: '0.65rem'
                                          }}>
                                            {day.slice(0, 3)}
                                          </div>
                                        ))}
                                        
                                        {/* Time slots */}
                                        {timeSlots.map(timeSlot => (
                                          <React.Fragment key={timeSlot}>
                                            <div style={{ 
                                              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                              padding: '0.25rem',
                                              textAlign: 'right',
                                              position: 'sticky',
                                              left: 0,
                                              zIndex: 1,
                                              fontSize: '0.65rem'
                                            }}>
                                              {timeSlot.replace(' ', '')}
                                            </div>
                                            {days.map(day => {
                                              const key = `${day}-${timeSlot}`;
                                              const count = availabilityCount[key] || 0;
                                              const percentage = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
                                              
                                              // Color intensity based on percentage
                                              let backgroundColor, borderColor, textColor;
                                              if (percentage === 100) {
                                                backgroundColor = 'rgba(76, 175, 80, 0.8)'; // Green - all available
                                                borderColor = '#4CAF50';
                                                textColor = '#fff';
                                              } else if (percentage >= 50) {
                                                backgroundColor = `rgba(76, 175, 80, ${0.3 + (percentage / 100) * 0.5})`; // Light green
                                                borderColor = 'rgba(76, 175, 80, 0.5)';
                                                textColor = '#fff';
                                              } else if (percentage > 0) {
                                                backgroundColor = `rgba(255, 193, 7, ${0.2 + (percentage / 100) * 0.4})`; // Yellow/amber
                                                borderColor = 'rgba(255, 193, 7, 0.5)';
                                                textColor = '#fff';
                                              } else {
                                                backgroundColor = 'rgba(255, 255, 255, 0.05)'; // Gray - none available
                                                borderColor = 'rgba(255, 255, 255, 0.1)';
                                                textColor = 'rgba(255, 255, 255, 0.3)';
                                              }
                                              
                                              return (
                                                <div
                                                  key={`${day}-${timeSlot}`}
                                                  style={{
                                                    backgroundColor,
                                                    border: `1px solid ${borderColor}`,
                                                    minHeight: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.6rem',
                                                    color: textColor
                                                  }}
                                                  title={`${day} ${timeSlot}: ${count}/${totalMembers} members available`}
                                                >
                                                  {count > 0 ? count : ''}
                                                </div>
                                              );
                                            })}
                                          </React.Fragment>
                                        ))}
                                      </div>
                                      <div style={{ 
                                        marginTop: '0.5rem', 
                                        fontSize: '0.7rem', 
                                        color: 'rgba(240, 240, 240, 0.6)',
                                        display: 'flex',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap',
                                        padding: '0.5rem'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(76, 175, 80, 0.8)', border: '1px solid #4CAF50' }}></div>
                                          <span>All</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(76, 175, 80, 0.5)', border: '1px solid rgba(76, 175, 80, 0.5)' }}></div>
                                          <span>50%+</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(255, 193, 7, 0.4)', border: '1px solid rgba(255, 193, 7, 0.5)' }}></div>
                                          <span>Some</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}></div>
                                          <span>None</span>
                                        </div>
                                      </div>
                                    </div>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="team-actions">
                                {isCurrentTeam ? (
                                  <>
                                    <button
                                      className="edit-team-btn"
                                      onClick={() => openEditModal(project, team)}
                                    >
                                      Edit Team
                                    </button>
                                    <span style={{ marginLeft: 8, fontStyle: 'italic' }}>(Your team)</span>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleJoinTeam(project.id, team)}
                                    disabled={isFull}
                                    className="join-btn"
                                  >
                                    {isFull ? 'Team Full' : 'Join Team'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unassigned Students Sidebar */}
                    {unassignedStudents[project.id] && unassignedStudents[project.id].length > 0 && (
                      <div className="unassigned-students-sidebar" style={{ 
                        position: 'sticky',
                        top: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '1rem',
                        maxHeight: 'calc(100vh - 200px)',
                        overflowY: 'auto'
                      }}>
                        <h5 style={{ 
                          marginBottom: '0.75rem', 
                          color: '#f0f0f0',
                          fontSize: '1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          paddingBottom: '0.5rem'
                        }}>
                          Students Not in a Team ({unassignedStudents[project.id].length})
                        </h5>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          {unassignedStudents[project.id].map((unassignedStudent) => (
                            <button
                              key={unassignedStudent.id}
                              onClick={() => {
                                setProfileStudent(unassignedStudent);
                                setInvitingStudent({ student: unassignedStudent, projectId: project.id });
                              }}
                              style={{
                                padding: '0.75rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                color: '#f0f0f0',
                                fontSize: '0.9rem',
                                width: '100%'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                                e.target.style.borderColor = '#4CAF50';
                                e.target.style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.transform = 'translateX(0)';
                              }}
                            >
                              <div style={{ fontWeight: 500 }}>
                                {unassignedStudent.name || unassignedStudent.email}
                              </div>
                              {unassignedStudent.name && unassignedStudent.email && (
                                <div style={{ 
                                  color: 'rgba(240, 240, 240, 0.6)', 
                                  fontSize: '0.85em',
                                  marginTop: '0.25rem'
                                }}>
                                  {unassignedStudent.email}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No projects assigned yet.</p>
        )
      )}
      {editingTeam && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" style={{ background: '#fff', padding: 16, borderRadius: 8, width: 'min(520px, 92vw)' }}>
            <h4>Edit Team</h4>
            <form onSubmit={submitEdit}>
              <div style={{ marginBottom: 8 }}>
                <label>Team Name</label>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Description</label>
                <textarea
                  value={editValues.description}
                  onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
                  style={{ width: '100%' }}
                  rows={3}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Team Size</label>
                <input
                  type="number"
                  min={editingTeam.project?.minTeamSize || 1}
                  max={editingTeam.project?.maxTeamSize || undefined}
                  value={editValues.maxMembers}
                  onChange={(e) => setEditValues(v => ({ ...v, maxMembers: e.target.value }))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: 12, color: '#555' }}>
                  Must be between {editingTeam.project?.minTeamSize} and {editingTeam.project?.maxTeamSize}, and ≥ current members ({(editingTeam.team.members || []).length}).
                </div>
              </div>
              {editError ? <div style={{ color: 'red', marginBottom: 8 }}>{editError}</div> : null}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeEditModal}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {profileStudent && (() => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const timeSlots = [
          '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
          '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
          '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
        ];
        
        let availability = {};
        try {
          availability = profileStudent.availability 
            ? (typeof profileStudent.availability === 'string' 
                ? JSON.parse(profileStudent.availability) 
                : profileStudent.availability)
            : {};
        } catch (e) {
          availability = {};
        }

        return (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal" style={{ background: '#fff', padding: 16, borderRadius: 8, width: 'min(90vw, 900px)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h4>Student Profile</h4>
              <div style={{ display: 'grid', gap: 8, marginBottom: '1rem' }}>
                <div>
                  <strong>Name:</strong> {profileStudent.name || '\u2014'}
                </div>
                <div>
                  <strong>Email:</strong> {profileStudent.email || '\u2014'}
                </div>
                <div>
                  <strong>Major:</strong> {profileStudent.major || '\u2014'}
                </div>
                <div>
                  <strong>Year:</strong> {profileStudent.year || '\u2014'}
                </div>
                <div>
                  <strong>Skills:</strong> {profileStudent.skills ? (() => { try { const arr = JSON.parse(profileStudent.skills); return Array.isArray(arr) ? arr.join(', ') : String(profileStudent.skills); } catch { return String(profileStudent.skills); } })() : '\u2014'}
                </div>
                <div>
                  <strong>Interests:</strong> {profileStudent.interests || '\u2014'}
                </div>
              </div>

              {/* Availability Visualization */}
              <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1rem' }}>Availability</strong>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'auto',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px repeat(7, 1fr)',
                    gap: '2px',
                    backgroundColor: '#ddd',
                    padding: '2px'
                  }}>
                    {/* Header row */}
                    <div style={{ 
                      backgroundColor: '#fff', 
                      padding: '0.5rem', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      position: 'sticky',
                      left: 0,
                      zIndex: 2
                    }}></div>
                    {days.map(day => (
                      <div key={day} style={{ 
                        backgroundColor: '#fff', 
                        padding: '0.5rem', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: '0.85rem'
                      }}>
                        {day.slice(0, 3)}
                      </div>
                    ))}
                    
                    {/* Time slots */}
                    {timeSlots.map(timeSlot => (
                      <React.Fragment key={timeSlot}>
                        <div style={{ 
                          backgroundColor: '#fff', 
                          padding: '0.5rem',
                          fontSize: '0.8rem',
                          textAlign: 'right',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          borderRight: '2px solid #ddd'
                        }}>
                          {timeSlot}
                        </div>
                        {days.map(day => {
                          const isAvailable = availability[day]?.[timeSlot] === true;
                          return (
                            <div
                              key={`${day}-${timeSlot}`}
                              style={{
                                backgroundColor: isAvailable ? '#4CAF50' : '#fff',
                                minHeight: '24px',
                                border: isAvailable ? '1px solid #45a049' : '1px solid #f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}
                              title={`${day} ${timeSlot}: ${isAvailable ? 'Available' : 'Not Available'}`}
                            >
                              {isAvailable ? '✓' : ''}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.85rem', 
                  color: '#666',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#4CAF50', border: '1px solid #45a049' }}></div>
                    <span>Available</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#fff', border: '1px solid #f0f0f0' }}></div>
                    <span>Not Available</span>
                  </div>
                </div>
              </div>
            {invitingStudent && student && (() => {
              const project = projects.find(p => p.id === invitingStudent.projectId);
              if (!project) return null;
              const currentTeamId = getStudentCurrentTeamIdForProject(project);
              if (!currentTeamId) return null;
              const currentTeam = project.teams?.find(t => t.id === currentTeamId);
              if (!currentTeam) return null;
              const isTeamFull = (currentTeam.members?.length || 0) >= (currentTeam.maxMembers || 0);
              
              return (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                  {isTeamFull ? (
                    <div style={{ 
                      padding: '0.5rem', 
                      backgroundColor: '#ffebee', 
                      color: '#c62828',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '0.9rem'
                    }}>
                      Your team is full ({currentTeam.members?.length || 0}/{currentTeam.maxMembers || 0} members)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInviteToTeam(profileStudent.id, invitingStudent.projectId)}
                      disabled={loading}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        width: '100%'
                      }}
                    >
                      {loading ? 'Sending...' : 'Invite to Your Team'}
                    </button>
                  )}
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => {
                setProfileStudent(null);
                setInvitingStudent(null);
              }}>Close</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Team Invitations Section - Only show invitations not associated with any visible project */}
      {(() => {
        const projectIds = new Set(projects.map(p => p.id));
        const orphanedInvitations = invitations.filter(inv => 
          !inv.team?.project?.id || !projectIds.has(inv.team.project.id)
        );
        
        return orphanedInvitations.length > 0 ? (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#f0f0f0', marginBottom: '1rem' }}>Other Team Invitations ({orphanedInvitations.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orphanedInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ color: '#f0f0f0', marginBottom: '0.5rem' }}>
                    <strong>{invitation.inviter?.name || invitation.inviter?.email}</strong> invited you to join{' '}
                    <strong>{invitation.team?.name || `Team ${invitation.team?.teamNumber || ''}`}</strong>
                    {invitation.team?.project && (
                      <> in <strong>{invitation.team.project.name}</strong></>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => handleRespondToInvitation(invitation.id, 'accepted', invitation)}
                      disabled={loading}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToInvitation(invitation.id, 'rejected', invitation)}
                      disabled={loading}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default StudentDashboard;
