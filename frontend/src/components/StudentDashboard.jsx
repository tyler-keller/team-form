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

      // Show only projects the student is already in, but include full team details
      const filtered = (projectsResponse.data || []).filter(project =>
        project.teams?.some(team =>
          team.members?.some(member => member.student?.email === email)
        )
      );
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
              return (
                <div key={project.id} className="project-card">
                  <h4>{project.name}</h4>
                  {project.description ? <p>{project.description}</p> : null}
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
      {profileStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" style={{ background: '#fff', padding: 16, borderRadius: 8, width: 'min(520px, 92vw)' }}>
            <h4>Student Profile</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <strong>Major:</strong> {profileStudent.major || '—'}
              </div>
              <div>
                <strong>Year:</strong> {profileStudent.year || '—'}
              </div>
              <div>
                <strong>Skills:</strong> {profileStudent.skills ? (() => { try { const arr = JSON.parse(profileStudent.skills); return Array.isArray(arr) ? arr.join(', ') : String(profileStudent.skills); } catch { return String(profileStudent.skills); } })() : '—'}
              </div>
              <div>
                <strong>Interests:</strong> {profileStudent.interests || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setProfileStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
