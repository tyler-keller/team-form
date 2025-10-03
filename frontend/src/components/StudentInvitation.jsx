import { useState, useEffect } from 'react'
import axios from 'axios'
import StudentProfileForm from './StudentProfileForm'
import './StudentInvitation.css'

const StudentInvitation = ({ projectId, studentEmail }) => {
  const [project, setProject] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState('profile') // 'profile', 'teams'
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teams, setTeams] = useState([])

  useEffect(() => {
    fetchProject()
    checkStudent()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`)
      setProject(response.data)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project')
    }
  }

  const checkStudent = async () => {
    try {
      // Check if student already exists
      const studentsResponse = await axios.get('/api/students')
      const existingStudent = studentsResponse.data.find(s => s.email === studentEmail)
      
      if (existingStudent) {
        setStudent(existingStudent)
        setStep('teams')
        fetchTeams()
      } else {
        setStep('profile')
      }
    } catch (error) {
      console.error('Error checking student:', error)
      setError('Failed to check student status')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/teams`)
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
      setError('Failed to load teams')
    }
  }

  const handleProfileCreated = async (newStudent) => {
    setStudent(newStudent)
    setStep('teams')
    await fetchTeams()
  }

  const handleJoinTeam = async (teamId) => {
    try {
      await axios.post(`/api/teams/${teamId}/members`, {
        studentId: student.id,
        role: 'member'
      })
      
      setSelectedTeam(teamId)
      await fetchTeams() // Refresh teams
      alert('Successfully joined team!')
    } catch (error) {
      console.error('Error joining team:', error)
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('Failed to join team')
      }
    }
  }

  const handleLeaveTeam = async (teamId) => {
    try {
      await axios.delete(`/api/teams/${teamId}/members/${student.id}`)
      setSelectedTeam(null)
      await fetchTeams() // Refresh teams
      alert('Left team successfully!')
    } catch (error) {
      console.error('Error leaving team:', error)
      alert('Failed to leave team')
    }
  }

  const handleUpdateTeam = async (teamId, name, description) => {
    try {
      await axios.put(`/api/teams/${teamId}`, {
        name,
        description
      })
      await fetchTeams() // Refresh teams
      alert('Team updated successfully!')
    } catch (error) {
      console.error('Error updating team:', error)
      alert('Failed to update team')
    }
  }

  if (loading) {
    return (
      <div className="student-invitation">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="student-invitation">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="student-invitation">
        <div className="error-message">Project not found</div>
      </div>
    )
  }

  return (
    <div className="student-invitation">
      <div className="invitation-header">
        <h2>Welcome to {project.name}!</h2>
        <p className="project-description">{project.description}</p>
        <div className="project-info">
          <div className="info-item">
            <strong>Instructor:</strong> {project.instructor.name}
          </div>
          <div className="info-item">
            <strong>Team Size:</strong> {project.minTeamSize}-{project.maxTeamSize} members
          </div>
          <div className="info-item">
            <strong>Your Email:</strong> {studentEmail}
          </div>
        </div>
      </div>

      {step === 'profile' && (
        <div className="profile-step">
          <h3>Complete Your Profile</h3>
          <p>Please complete your student profile to join a team.</p>
          <StudentProfileForm 
            onSuccess={handleProfileCreated}
            initialEmail={studentEmail}
          />
        </div>
      )}

      {step === 'teams' && (
        <div className="teams-step">
          <h3>Join a Team</h3>
          <p>Select a team to join or update your current team.</p>
          
          <div className="teams-grid">
            {teams.map(team => {
              const isMember = team.members.some(member => member.student.id === student.id)
              const isFull = team.members.length >= team.maxMembers
              
              return (
                <div key={team.id} className={`team-card ${isMember ? 'joined' : ''} ${isFull && !isMember ? 'full' : ''}`}>
                  <div className="team-header">
                    <h4>{team.name}</h4>
                    <div className="team-number">Team {team.teamNumber}</div>
                  </div>
                  
                  <div className="team-members">
                    <strong>Members ({team.members.length}/{team.maxMembers}):</strong>
                    {team.members.length === 0 ? (
                      <div className="no-members">No members yet</div>
                    ) : (
                      <div className="members-list">
                        {team.members.map(member => (
                          <div key={member.id} className="member-item">
                            <span className="member-name">{member.student.name}</span>
                            {member.role && (
                              <span className="member-role">({member.role})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {team.description && (
                    <div className="team-description">
                      <strong>Description:</strong> {team.description}
                    </div>
                  )}
                  
                  <div className="team-actions">
                    {isMember ? (
                      <div className="member-actions">
                        <button 
                          onClick={() => setSelectedTeam(team.id)}
                          className="edit-button"
                        >
                          Edit Team
                        </button>
                        <button 
                          onClick={() => handleLeaveTeam(team.id)}
                          className="leave-button"
                        >
                          Leave Team
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={isFull}
                        className={`join-button ${isFull ? 'disabled' : ''}`}
                      >
                        {isFull ? 'Team Full' : 'Join Team'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedTeam && (
        <TeamEditModal
          team={teams.find(t => t.id === selectedTeam)}
          onUpdate={handleUpdateTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  )
}

const TeamEditModal = ({ team, onUpdate, onClose }) => {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(team.id, name, description)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit Team</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="teamName">Team Name</label>
            <input
              type="text"
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="teamDescription">Description</label>
            <textarea
              id="teamDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentInvitation
