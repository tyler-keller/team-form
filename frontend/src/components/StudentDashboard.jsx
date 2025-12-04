import './StudentDashboard.css';
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
  const [peerReviewProject, setPeerReviewProject] = useState(null); // project for peer review
  const [teamMembersForReview, setTeamMembersForReview] = useState([]);
  const [peerReviewTexts, setPeerReviewTexts] = useState({}); // { revieweeId: reviewText }
  const [peerReviewLoading, setPeerReviewLoading] = useState(false);
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

      // Show projects where the student is either already in a team OR invited by email
      const filtered = (projectsResponse.data || []).filter(project => {
        const isMember = (project.teams || []).some(team =>
          (team.members || []).some(member => member.student?.email === email)
        );
        if (isMember) return true;
        // Check invited list; backend stores studentEmails as a JSON string
        let invited = [];
        try {
          if (project.studentEmails) invited = JSON.parse(project.studentEmails);
        } catch (_) {
          invited = [];
        }
        return Array.isArray(invited) && invited.includes(email);
      });
      setProjects(filtered);
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

  const handleJoinTeam = async (projectId, team) => {
    if (!student) {
      alert('Please complete your student profile before joining a team.');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    
    // Check if project is completed
    if (project && project.status === 'completed') {
      alert('Cannot join teams for a completed project.');
      return;
    }
    
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

  const handleLeaveTeam = async (projectId, teamId) => {
    if (!student) {
      alert('Please complete your student profile first.');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    
    // Check if project is completed
    if (project && project.status === 'completed') {
      alert('Cannot leave teams for a completed project.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to leave this team?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await axios.delete(`/api/teams/${teamId}/members/${student.id}`);
      await initialize(studentEmail);
      alert('Successfully left the team');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to leave team';
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

  const openPeerReviewModal = async (project) => {
    if (!student) {
      alert('Please complete your student profile first.');
      return;
    }
    
    try {
      setPeerReviewLoading(true);
      const response = await axios.get(`/api/projects/${project.id}/team-members/${student.id}`);
      setTeamMembersForReview(response.data.teamMembers || []);
      
      // Load existing reviews
      const reviewsResponse = await axios.get(`/api/projects/${project.id}/peer-reviews/student/${student.id}`);
      const existingReviews = {};
      reviewsResponse.data.forEach(review => {
        existingReviews[review.revieweeId] = review.reviewText || '';
      });
      setPeerReviewTexts(existingReviews);
      
      setPeerReviewProject(project);
    } catch (error) {
      alert('Failed to load team members for review: ' + (error.response?.data?.error || error.message));
    } finally {
      setPeerReviewLoading(false);
    }
  };

  const closePeerReviewModal = () => {
    setPeerReviewProject(null);
    setTeamMembersForReview([]);
    setPeerReviewTexts({});
  };

  const submitPeerReview = async (revieweeId) => {
    if (!student || !peerReviewProject) return;
    
    const reviewText = peerReviewTexts[revieweeId] || '';
    
    try {
      setPeerReviewLoading(true);
      await axios.post('/api/peer-reviews', {
        reviewerId: student.id,
        revieweeId: revieweeId,
        projectId: peerReviewProject.id,
        reviewText: reviewText.trim()
      });
      
      // Update the hasReview status
      setTeamMembersForReview(prev => 
        prev.map(member => 
          member.id === revieweeId ? { ...member, hasReview: true } : member
        )
      );
      
      alert('Peer review submitted successfully!');
    } catch (error) {
      alert('Failed to submit peer review: ' + (error.response?.data?.error || error.message));
    } finally {
      setPeerReviewLoading(false);
    }
  };

  return (
    <div className="student-dashboard team-dashboard">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="nav-btn" style={{ marginTop: '1rem', marginRight: '1rem' }}>Logout</button>
      </div>
      <h2>Student Dashboard</h2>
      {/* Only className for styling, no inline style here! */}
      <button onClick={() => navigate('/edit-profile')} className="edit-profile-btn">Edit Profile</button>
      <h3>Your Projects</h3>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        projects.length > 0 ? (
          <div className="projects-list">
            {projects.map((project) => {
              const currentTeamId = getStudentCurrentTeamIdForProject(project);
              const isCompleted = project.status === 'completed';
              const isInTeam = currentTeamId !== null;
              return (
                <div key={project.id} className="project-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4>{project.name}</h4>
                    <span
                      className={`project-status-span${project.status === 'cancelled' ? ' cancelled' : project.status === 'completed' ? ' completed' : project.status === 'active' ? ' active' : ''}`}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        color: 'white'
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                  {project.description ? <p>{project.description}</p> : null}
                  {isCompleted && isInTeam && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>This project is completed. Please provide peer reviews for your team members.</p>
                      <button
                        onClick={() => openPeerReviewModal(project)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Fill Out Peer Reviews
                      </button>
                    </div>
                  )}
                  <div className="teams-section">
                    <h5>Teams</h5>
                    <div className="teams-grid">
                      {(project.teams || []).map(team => {
                        const members = team.members || [];
                        const isFull = members.length >= (team.maxMembers || 0);
                        const isCurrentTeam = currentTeamId === team.id;
                        return (
                          <div key={team.id} className="team-card">
                            <div className="team-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <strong>{team.name || `Team ${team.teamNumber || ''}`}</strong>
                                {isCurrentTeam && (
                                  <button
                                    className="edit-team-btn"
                                    onClick={() => openEditModal(project, team)}
                                    disabled={project.status === 'completed'}
                                    title="Edit Team"
                                    style={{ margin: 0, background: 'none', backgroundColor: 'transparent', boxShadow: 'none', border: 'none', outline: 'none' }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                      <path d="M14.85 2.85a1.2 1.2 0 0 1 1.7 1.7l-9.1 9.1-2.1.4.4-2.1 9.1-9.1Zm2.12-2.12a3.2 3.2 0 0 0-4.53 0l-9.1 9.1A1 1 0 0 0 3 11.5v3.5a1 1 0 0 0 1 1h3.5a1 1 0 0 0 .7-.29l9.1-9.1a3.2 3.2 0 0 0 0-4.53Z" fill="#f0f0f0"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
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
                                  style={{ background: 'none', backgroundColor: 'transparent', boxShadow: 'none', border: 'none', outline: 'none' }}
                                >
                                  <span
                                    className="student-name-chip"
                                    tabIndex={0}
                                    role="button"
                                    onMouseEnter={e => e.currentTarget.classList.add('hover')}
                                    onMouseLeave={e => e.currentTarget.classList.remove('hover')}
                                    onFocus={e => e.currentTarget.classList.add('hover')}
                                    onBlur={e => e.currentTarget.classList.remove('hover')}
                                  >
                                    {m.student?.name || 'Student'}{m.student?.email ? ` (${m.student.email})` : ''}
                                  </span>
                                </button>
                              ))}
                              {members.length === 0 ? <div className="member-row">No members yet</div> : null}
                            </div>
                            <div className="team-actions">
                              {isCurrentTeam ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                  <button
                                    className="leave-team-btn"
                                    onClick={() => handleLeaveTeam(project.id, team.id)}
                                    disabled={project.status === 'completed'}
                                    style={{
                                      cursor: project.status === 'completed' ? 'not-allowed' : 'pointer',
                                      opacity: project.status === 'completed' ? 0.6 : 1
                                    }}
                                  >
                                    Leave Team
                                  </button>
                                  <span style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>(Your team)</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleJoinTeam(project.id, team)}
                                  disabled={isFull || project.status === 'completed'}
                                  className="join-btn"
                                >
                                  {project.status === 'completed' ? 'Project Completed' : isFull ? 'Team Full' : 'Join Team'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
          <div className="modal" style={{ background: '#181a26', padding: 16, borderRadius: 8, width: 'min(520px, 92vw)' }}>
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
      {profileStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" style={{ background: '#181a26', padding: 16, borderRadius: 8, width: 'min(520px, 92vw)' }}>
            <h4>Student Profile</h4>
            <div style={{ display: 'grid', gap: 8 }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setProfileStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {peerReviewProject && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" style={{ background: '#181a26', padding: 20, borderRadius: 8, width: 'min(600px, 92vw)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4>Peer Reviews for {peerReviewProject.name}</h4>
            <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
              Please provide feedback for each of your team members. Your reviews will be visible to the instructor.
            </p>
            {peerReviewLoading && teamMembersForReview.length === 0 ? (
              <p>Loading team members...</p>
            ) : teamMembersForReview.length === 0 ? (
              <p>No team members found to review.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {teamMembersForReview.map(member => (
                  <div key={member.id} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                      {member.name || member.email}
                      {member.hasReview && (
                        <span style={{ marginLeft: '0.5rem', color: '#4CAF50', fontSize: '0.875rem' }}>
                          ✓ Review submitted
                        </span>
                      )}
                    </div>
                    <textarea
                      placeholder="Enter your peer review for this team member..."
                      value={peerReviewTexts[member.id] || ''}
                      onChange={(e) => setPeerReviewTexts(prev => ({ ...prev, [member.id]: e.target.value }))}
                      rows={4}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '0.5rem' }}
                    />
                    <button
                      onClick={() => submitPeerReview(member.id)}
                      disabled={peerReviewLoading}
                      style={{
                        padding: '0.5rem 1rem',
                        background: member.hasReview ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: peerReviewLoading ? 'not-allowed' : 'pointer',
                        opacity: peerReviewLoading ? 0.6 : 1
                      }}
                    >
                      {member.hasReview ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={closePeerReviewModal}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
