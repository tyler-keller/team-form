import { useState, useEffect } from 'react'
import axios from 'axios'
import './CreateTeamForm.css'

const CreateTeamForm = ({ onSuccess }) => {
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [studentsLoading, setStudentsLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true)
      const response = await axios.get('/api/students')
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to fetch students')
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!teamName.trim()) {
      setError('Team name is required')
      return
    }
    
    if (selectedStudents.length === 0) {
      setError('Please select at least one student')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create the team
      const teamResponse = await axios.post('/api/teams', {
        name: teamName,
        description: teamDescription
      })

      const teamId = teamResponse.data.id

      // Add selected students to the team
      for (const studentId of selectedStudents) {
        await axios.post(`/api/teams/${teamId}/members`, {
          studentId: studentId,
          role: 'member'
        })
      }

      if (onSuccess) {
        onSuccess(teamResponse.data)
      }

      // Reset form
      setTeamName('')
      setTeamDescription('')
      setSelectedStudents([])
      
    } catch (error) {
      console.error('Error creating team:', error)
      setError('Failed to create team. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatSkills = (skills) => {
    if (!skills) return []
    try {
      return typeof skills === 'string' ? JSON.parse(skills) : skills
    } catch {
      return []
    }
  }

  if (studentsLoading) {
    return (
      <div className="create-team-form">
        <h2>Create Team</h2>
        <div className="loading">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="create-team-form">
      <h2>Create Team</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="teamName">Team Name *</label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            placeholder="Enter team name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="teamDescription">Team Description</label>
          <textarea
            id="teamDescription"
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            placeholder="Describe the team's purpose or goals..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Select Students ({selectedStudents.length} selected)</label>
          <div className="students-selection">
            {students.length === 0 ? (
              <div className="no-students">
                No students available. Create student profiles first!
              </div>
            ) : (
              <div className="students-grid">
                {students.map(student => (
                  <div key={student.id} className="student-option">
                    <label className="student-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                      />
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                        <div className="student-email">{student.email}</div>
                        {student.major && (
                          <div className="student-major">{student.major}</div>
                        )}
                        {formatSkills(student.skills).length > 0 && (
                          <div className="student-skills">
                            {formatSkills(student.skills).map((skill, index) => (
                              <span key={index} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Creating Team...' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}

export default CreateTeamForm
