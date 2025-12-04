import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import AvailabilityHeatmap from './AvailabilityHeatmap'
import './InstructorDashboard.css'
import './ProjectDetails.css'

const TextArea = (props) => (
  <textarea {...props} style={{ width: '100%' }} />
)

const Toast = ({ message, onClose }) => (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#f44336',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }}>
    <span>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2em' }}>&times;</button>
  </div>
)

const ProjectDetails = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [project, setProject] = useState(null)
  const [roster, setRoster] = useState({ students: [], teams: [], invitedEmails: [] })

  const [editProject, setEditProject] = useState(null)

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [projectId])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const invitedEmails = roster.invitedEmails || []
  const unassignedStudents = useMemo(() => roster.students.filter(s => !s.teamId), [roster])
  const notSignedUpEmails = useMemo(() => {
    const signedUp = new Set(roster.students.map(s => s.email))
    return invitedEmails.filter(e => !signedUp.has(e))
  }, [invitedEmails, roster.students])

  const moveStudent = async (studentId, toTeamId) => {
    try {
      await axios.post(`/api/projects/${projectId}/move-student`, { studentId, toTeamId })
      fetchAll(true)
    } catch (e) { 
      setToast('Failed to move student: ' + (e.response?.data?.error || e.message))
      // Revert state by fetching fresh data
      fetchAll(true)
      // refresh page
    }
  }

  const autoAssignStragglers = async () => {
    try {
      await axios.post(`/api/projects/${projectId}/auto-assign-stragglers`)
      fetchAll()
    } catch (e) { setError('Failed to auto-assign stragglers') }
  }

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result

    if (!destination) return

    if (source.droppableId === destination.droppableId) return

    const studentId = parseInt(draggableId.replace('student-', ''))
    let toTeamId = null

    if (destination.droppableId !== 'unassigned') {
      toTeamId = parseInt(destination.droppableId.replace('team-', ''))
    }

    // Optimistic update
    const student = roster.students.find(s => s.id === studentId)
    if (!student) return

    // Update roster locally
    const newRoster = { ...roster }
    const studentIndex = newRoster.students.findIndex(s => s.id === studentId)
    newRoster.students[studentIndex] = { ...student, teamId: toTeamId }
    setRoster(newRoster)

    // Update project teams locally
    const newProject = { ...project }
    const sourceTeamId = source.droppableId === 'unassigned' ? null : parseInt(source.droppableId.replace('team-', ''))
    
    // Remove from source
    if (sourceTeamId) {
      const sourceTeam = newProject.teams.find(t => t.id === sourceTeamId)
      if (sourceTeam) {
        sourceTeam.members = sourceTeam.members.filter(m => m.student.id !== studentId)
      }
    }

    // Add to destination
    if (toTeamId) {
      const destTeam = newProject.teams.find(t => t.id === toTeamId)
      if (destTeam) {
        // Check capacity locally to prevent UI flicker if we know it will fail
        if (destTeam.members.length >= destTeam.maxMembers) {
           setToast(`Team ${destTeam.name} is full (max ${destTeam.maxMembers})`)
           // wait a second then refresh page
           setTimeout(() => {
             window.location.reload()
           }, 1000)
           return // Don't call API, don't update state (revert happens automatically by not updating state)
        }
        destTeam.members.push({ id: Date.now(), student: student }) // Temp member ID
      }
    }
    setProject(newProject)

    moveStudent(studentId, toTeamId)
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
      fetchAll(true)
    } catch (e) { setError('Failed to update team') }
  }

  const [profileStudent, setProfileStudent] = useState(null)

  const inviteStudents = async (emailsText) => {
    const emails = emailsText.split('\n').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) return
    try {
      await axios.post(`/api/projects/${projectId}/invite`, { emails })
      fetchAll(true)
    } catch (e) { setError('Failed to invite students') }
  }

  if (loading) return <div className="instructor-dashboard"><h2>Project</h2><div className="loading">Loading...</div></div>
  if (error) return <div className="instructor-dashboard"><h2>Project</h2><div className="error-message">{error}</div></div>

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
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

      {/* Global Availability */}
      <div className="section">
        <h3>Global Availability</h3>
        <AvailabilityHeatmap students={roster.students} />
      </div>

      {/* Invite new students */}
      <div className="section">
        <h3>Invite Students</h3>
        <InviteForm onInvite={inviteStudents} />
      </div>

      {/* Unassigned */}
      <div className="section">
        <h3>Unassigned Students ({unassignedStudents.length})</h3>
        <Droppable droppableId="unassigned">
          {(provided) => (
            <div
              className="students-list"
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ minHeight: '100px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: '4px' }}
            >
              {unassignedStudents.map((s, index) => (
                <Draggable key={s.id} draggableId={`student-${s.id}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="student-card"
                      style={{
                        ...provided.draggableProps.style,
                        marginBottom: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#f0f0f0',
                        padding: '8px',
                        borderRadius: '4px',
                        // Fix for DnD positioning
                        top: provided.draggableProps.style?.top,
                        left: provided.draggableProps.style?.left,
                      }}
                    >
                      <div className="student-name">{s.name || s.email}</div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {unassignedStudents.length === 0 && (
                 <div className="no-data" style={{textAlign: 'center', padding: '20px', color: 'rgba(240, 240, 240, 0.7)'}}>
                    {roster.students.length === 0 && invitedEmails.length > 0 
                      ? "No students have signed up yet." 
                      : "Drop students here to unassign"}
                 </div>
              )}
            </div>
          )}
        </Droppable>
        <button className="submit-button" onClick={autoAssignStragglers} style={{ marginTop: '10px' }}>Auto-Assign Stragglers</button>
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
              
              <details style={{ marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', color: '#f0f0f0', fontSize: '0.9rem', userSelect: 'none' }}>Show Availability Heatmap</summary>
                <div style={{ marginTop: '0.5rem' }}>
                  <AvailabilityHeatmap students={team.members.map(m => m.student)} />
                </div>
              </details>

              <Droppable droppableId={`team-${team.id}`}>
                {(provided) => (
                  <div
                    className="students-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ minHeight: '50px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: '4px', marginTop: '10px' }}
                  >
                    {team.members.map((m, index) => (
                      <Draggable key={m.student.id} draggableId={`student-${m.student.id}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="student-card"
                            style={{
                              ...provided.draggableProps.style,
                              marginBottom: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#f0f0f0',
                              padding: '8px',
                              borderRadius: '4px',
                              // Fix for DnD positioning
                              top: provided.draggableProps.style?.top,
                              left: provided.draggableProps.style?.left,
                            }}
                          >
                            <button
                              className="student-name"
                              onClick={() => setProfileStudent(m.student)}
                            >
                              {m.student.name || m.student.email}
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {team.members.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'rgba(240, 240, 240, 0.5)', fontSize: '0.9em' }}>
                        Drop students here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
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
    </DragDropContext>
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
