import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import './InstructorDashboard.css'

const TextArea = (props) => (
  <textarea {...props} style={{ width: '100%' }} />
)

const ProjectDetails = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [project, setProject] = useState(null)
  const [roster, setRoster] = useState({ students: [], teams: [], invitedEmails: [] })

  const [editProject, setEditProject] = useState(null)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [projRes, rosterRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}`),
        axios.get(`/api/projects/${projectId}/students`)
      ])
      setProject(projRes.data)
      setRoster(rosterRes.data)
      setEditProject({
        name: projRes.data.name,
        description: projRes.data.description,
        minTeamSize: projRes.data.minTeamSize,
        maxTeamSize: projRes.data.maxTeamSize,
        status: projRes.data.status
      })
    } catch (e) {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [projectId])

  const invitedEmails = roster.invitedEmails || []
  const unassignedStudents = useMemo(() => roster.students.filter(s => !s.teamId), [roster])
  const notSignedUpEmails = useMemo(() => {
    const signedUp = new Set(roster.students.map(s => s.email))
    return invitedEmails.filter(e => !signedUp.has(e))
  }, [invitedEmails, roster.students])

  const moveStudent = async (studentId, toTeamId) => {
    try {
      await axios.post(`/api/projects/${projectId}/move-student`, { studentId, toTeamId })
      fetchAll()
    } catch (e) { setError('Failed to move student') }
  }

  const autoAssignStragglers = async () => {
    try {
      await axios.post(`/api/projects/${projectId}/auto-assign-stragglers`)
      fetchAll()
    } catch (e) { setError('Failed to auto-assign stragglers') }
  }

  const saveProject = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`/api/projects/${projectId}`, editProject)
      await fetchAll()
    } catch (e) { setError('Failed to update project') }
  }

  const saveTeam = async (teamId, changes) => {
    try {
      await axios.put(`/api/teams/${teamId}/details`, changes)
      fetchAll()
    } catch (e) { setError('Failed to update team') }
  }

  const inviteStudents = async (emailsText) => {
    const emails = emailsText.split('\n').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) return
    try {
      await axios.post(`/api/projects/${projectId}/invite`, { emails })
      fetchAll()
    } catch (e) { setError('Failed to invite students') }
  }

  if (loading) return <div className="instructor-dashboard"><h2>Project</h2><div className="loading">Loading...</div></div>
  if (error) return <div className="instructor-dashboard"><h2>Project</h2><div className="error-message">{error}</div></div>

  return (
    <div className="instructor-dashboard">
      <h2>Project: {project.name}</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button className="toggle-button" onClick={() => navigate('/instructor')}>Back to Dashboard</button>
      </div>

      {/* Edit Project */}
      <div className="section">
        <h3>Edit Project</h3>
        <form onSubmit={saveProject} className="project-form">
          <div className="form-group">
            <label>Name</label>
            <input value={editProject.name} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <TextArea rows={3} value={editProject.description} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min Team Size</label>
              <input type="number" value={editProject.minTeamSize} onChange={(e) => setEditProject({ ...editProject, minTeamSize: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Max Team Size</label>
              <input type="number" value={editProject.maxTeamSize} onChange={(e) => setEditProject({ ...editProject, maxTeamSize: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={editProject.status} onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <button className="submit-button" type="submit">Save Project</button>
        </form>
      </div>

      {/* Invite new students */}
      <div className="section">
        <h3>Invite Students</h3>
        <InviteForm onInvite={inviteStudents} />
      </div>

      {/* Unassigned */}
      <div className="section">
        <h3>Unassigned Students ({unassignedStudents.length})</h3>
        {unassignedStudents.length === 0 ? (
          roster.students.length === 0 && invitedEmails.length > 0 ? (
            <div className="no-data">No students have signed up yet.</div>
          ) : (
            <div className="no-data">All signed-up students are assigned</div>
          )
        ) : (
          <div className="students-list">
            {unassignedStudents.map(s => (
              <div key={s.id} className="student-card">
                <div className="student-name">{s.name || s.email}</div>
                <div className="student-actions">
                  {project.teams.map(t => (
                    <button key={t.id} className="toggle-button" onClick={() => moveStudent(s.id, t.id)}>
                      Move to {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="submit-button" onClick={autoAssignStragglers}>Auto-Assign Stragglers</button>
      </div>

      {/* Invited but not signed up */}
      {notSignedUpEmails.length > 0 && (
        <div className="section">
          <h3>Invited (Not Signed Up) ({notSignedUpEmails.length})</h3>
          <div className="students-list">
            {notSignedUpEmails.map(email => (
              <div key={email} className="student-card">
                <div className="student-name">{email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="section">
        <h3>Teams ({project.teams.length})</h3>
        <div className="teams-list">
          {project.teams.map(team => (
            <div key={team.id} className="project-card">
              <div className="project-header">
                <input
                  value={team.name}
                  onChange={(e) => saveTeam(team.id, { name: e.target.value })}
                  onBlur={() => fetchAll()}
                />
                <span className="project-status">{team.locked ? 'Locked' : 'Open'}</span>
              </div>
              <TextArea
                rows={2}
                value={team.description || ''}
                onChange={(e) => saveTeam(team.id, { description: e.target.value })}
                onBlur={() => fetchAll()}
              />
              <div className="project-details">
                <div className="detail-item">
                  <strong>Members:</strong> {team.members.length} / {team.maxMembers}
                  {team.members.length > team.maxMembers && (
                    <span style={{ color: '#ffc107', marginLeft: 8 }}>
                      Over capacity by {team.members.length - team.maxMembers}
                    </span>
                  )}
                </div>
                <div className="detail-item">
                  <button className="toggle-button" onClick={() => saveTeam(team.id, { locked: !team.locked })}>
                    {team.locked ? 'Unlock' : 'Lock'} Team
                  </button>
                </div>
              </div>
              <div className="students-list">
                {team.members.map(m => (
                  <div key={m.id} className="student-card">
                    <div className="student-name">{m.student.name || m.student.email}</div>
                    <div className="student-actions">
                      <button className="toggle-button" onClick={() => moveStudent(m.student.id, null)}>Unassign</button>
                      {project.teams.filter(t => t.id !== team.id).map(t => (
                        <button key={t.id} className="toggle-button" onClick={() => moveStudent(m.student.id, t.id)}>To {t.name}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const InviteForm = ({ onInvite }) => {
  const [value, setValue] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onInvite(value); setValue('') } }>
      <div className="form-group">
        <label>Student Emails (one per line)</label>
        <TextArea rows={4} placeholder={'student1@example.com\nstudent2@example.com'} value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button className="submit-button" type="submit">Send Invites</button>
    </form>
  )
}

export default ProjectDetails
