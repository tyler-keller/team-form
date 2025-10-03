import { useState, useEffect } from 'react'
import axios from 'axios'
import './StudentsList.css'

const StudentsList = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/students')
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const formatAvailability = (availability) => {
    if (!availability) return 'Not specified'
    
    try {
      const avail = typeof availability === 'string' ? JSON.parse(availability) : availability
      const days = Object.keys(avail).filter(day => 
        Object.values(avail[day] || {}).some(slot => slot)
      )
      return days.length > 0 ? days.join(', ') : 'Not specified'
    } catch {
      return 'Not specified'
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

  if (loading) {
    return (
      <div className="students-list">
        <h2>Students</h2>
        <div className="loading">Loading students...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="students-list">
        <h2>Students</h2>
        <div className="error">{error}</div>
        <button onClick={fetchStudents} className="retry-button">Retry</button>
      </div>
    )
  }

  return (
    <div className="students-list">
      <div className="students-header">
        <h2>Students ({students.length})</h2>
        <button onClick={fetchStudents} className="refresh-button">Refresh</button>
      </div>
      
      {students.length === 0 ? (
        <div className="no-students">No students found. Create a profile to get started!</div>
      ) : (
        <div className="students-grid">
          {students.map(student => (
            <div key={student.id} className="student-card">
              <div className="student-header">
                <h3>{student.name}</h3>
                <span className="student-email">{student.email}</span>
              </div>
              
              <div className="student-details">
                {student.major && (
                  <div className="detail-item">
                    <strong>Major:</strong> {student.major}
                  </div>
                )}
                
                {student.year && (
                  <div className="detail-item">
                    <strong>Year:</strong> {student.year}
                  </div>
                )}
                
                {formatSkills(student.skills).length > 0 && (
                  <div className="detail-item">
                    <strong>Skills:</strong>
                    <div className="skills-tags">
                      {formatSkills(student.skills).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {student.interests && (
                  <div className="detail-item">
                    <strong>Interests:</strong> {student.interests}
                  </div>
                )}
                
                <div className="detail-item">
                  <strong>Availability:</strong> {formatAvailability(student.availability)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentsList
