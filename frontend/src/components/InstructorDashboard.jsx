import { useState, useEffect } from 'react'
import axios from 'axios'
import Papa from 'papaparse'
import './InstructorDashboard.css'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const InstructorDashboard = () => {
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
  const navigate = useNavigate()
  const [instructors, setInstructors] = useState([])
  const [projects, setProjects] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    minTeamSize: 3,
    maxTeamSize: 4,
    studentEmails: '',
    courseId: '',
    courseName: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const currentEmail = localStorage.getItem('instructorEmail')
      const [instructorsRes, projectsRes, coursesRes] = await Promise.all([
        axios.get('/api/instructors'),
        axios.get('/api/projects', { params: { instructorEmail: currentEmail } }),
        axios.get('/api/courses')
      ])
      setInstructors(instructorsRes.data)
      setProjects(projectsRes.data)
      setCourses(coursesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Ensure we have an instructor context; otherwise send to entry page
  useEffect(() => {
    const email = localStorage.getItem('instructorEmail')
    if (!email) {
  navigate('/instructor')
    }
  }, [navigate])

  

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      const studentEmails = newProject.studentEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0)
      
      // Resolve instructor from localStorage (current context)
      const instructorEmail = localStorage.getItem('instructorEmail')
      const instructor = instructors.find(i => i.email === instructorEmail)
      if (!instructor) {
        setError('Instructor not found. Please select/switch instructor again.')
        return
      }

      const response = await axios.post('/api/projects', {
        ...newProject,
        studentEmails,
        instructorId: instructor.id,
        courseId: newProject.courseId ? parseInt(newProject.courseId) : undefined,
        courseName: newProject.courseId ? undefined : (newProject.courseName || undefined)
      })
      
      setNewProject({
        name: '',
        description: '',
        minTeamSize: 3,
        maxTeamSize: 4,
        studentEmails: '',
        courseId: '',
        courseName: ''
      })
      setShowCreateProject(false)
      fetchData()
      
      alert(`Project created! ${response.data.emailsSent} invitation emails sent to students.`)
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create project')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const emails = results.data
          .map(row => row['Email'])
          .filter(email => email && email.trim().length > 0)
        
        if (emails.length > 0) {
          setNewProject(prev => ({
            ...prev,
            studentEmails: emails.join('\n')
          }))
        } else {
          alert('No emails found in the CSV file. Please ensure there is an "Email" column.')
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
        alert('Failed to parse CSV file.')
      }
    })
  }

  if (loading) {
    return (
      <div className="instructor-dashboard">
        <h2>Instructor Dashboard</h2>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="instructor-dashboard">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1.2rem', borderRadius: '1rem', background: '#1976d2', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}>Logout</button>
      </div>
      <h2>Instructor Dashboard</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-sections">
        {/* Instructor context info */}
        <div className="section">
          <h3>Instructor</h3>
          <div>
            Using: {localStorage.getItem('instructorEmail') || 'Unknown'}
            <div style={{ marginTop: '0.5rem' }}>
              <button className="toggle-button" onClick={() => navigate('/instructor')}>Switch Instructor</button>
            </div>
          </div>
        </div>

        {/* Create Project Section */}
        <div className="section">
          <h3>Create Project</h3>
          <button 
            onClick={() => setShowCreateProject(!showCreateProject)}
            className="toggle-button"
          >
            {showCreateProject ? 'Cancel' : 'Create New Project'}
          </button>
          
          {showCreateProject && (
            <form onSubmit={handleCreateProject} className="project-form">
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="projectDescription">Description</label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minTeamSize">Min Team Size</label>
                  <input
                    type="number"
                    id="minTeamSize"
                    value={newProject.minTeamSize}
                    onChange={(e) => setNewProject({ ...newProject, minTeamSize: parseInt(e.target.value) })}
                    min="2"
                    max="10"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="maxTeamSize">Max Team Size</label>
                  <input
                    type="number"
                    id="maxTeamSize"
                    value={newProject.maxTeamSize}
                    onChange={(e) => setNewProject({ ...newProject, maxTeamSize: parseInt(e.target.value) })}
                    min="2"
                    max="10"
                    required
                  />
                </div>
              </div>
              
              {/* Instructor is derived from current context (localStorage) */}

              <div className="form-group">
                <label htmlFor="courseSelect">Course</label>
                <select
                  id="courseSelect"
                  value={newProject.courseId || ''}
                  onChange={(e) => setNewProject({ ...newProject, courseId: e.target.value, courseName: '' })}
                >
                  <option value="">Create New Course…</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>

              {!newProject.courseId && (
                <div className="form-group">
                  <label htmlFor="courseName">New Course Name</label>
                  <input
                    type="text"
                    id="courseName"
                    value={newProject.courseName}
                    onChange={(e) => setNewProject({ ...newProject, courseName: e.target.value })}
                    placeholder="e.g., CS101 - Fall 2025"
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="studentEmails">Student Emails (one per line)</label>
                <div style={{ marginBottom: '0.5rem' }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ color: '#f0f0f0' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'rgba(240, 240, 240, 0.7)', marginTop: '0.25rem' }}>
                    Upload a CSV with an "Email" column. You can download a roster from Canvas: <a href="https://teacherscollege.screenstepslive.com/a/1286286-download-a-student-roster-in-canvas" target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>Instructions here</a>
                  </div>
                </div>
                <textarea
                  id="studentEmails"
                  value={newProject.studentEmails}
                  onChange={(e) => setNewProject({ ...newProject, studentEmails: e.target.value })}
                  rows="5"
                  placeholder="student1@example.com&#10;student2@example.com&#10;student3@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fileUpload">Or upload CSV file</label>
                <input
                  type="file"
                  id="fileUpload"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </div>
              
              <button type="submit" className="submit-button">Create Project & Send Invitations</button>
            </form>
          )}
        </div>

        {/* Projects List */}
        <div className="section">
          <h3>Projects ({projects.length})</h3>
          {projects.length === 0 ? (
            <div className="no-data">No projects found</div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h4><Link to={`/project/${project.id}`}>{project.name}</Link></h4>
                    <span className="project-status">{project.status}</span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-details">
                    <div className="detail-item">
                      <strong>Instructor:</strong> {project.instructor.name}
                    </div>
                    {project.course && (
                      <div className="detail-item">
                        <strong>Course:</strong> {project.course.name}
                      </div>
                    )}
                    <div className="detail-item">
                      <strong>Team Size:</strong> {project.minTeamSize}-{project.maxTeamSize} members
                    </div>
                    <div className="detail-item">
                      <strong>Teams Created:</strong> {project.teams.length}
                    </div>
                    <div className="detail-item">
                      <strong>Students Invited:</strong> {JSON.parse(project.studentEmails).length}
                    </div>
                    <div className="detail-item">
                      <strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {project.teams.length > 0 && (
                    <div className="teams-preview">
                      <h5>Teams:</h5>
                      <div className="teams-grid">
                        {project.teams.map(team => (
                          <div key={team.id} className="team-preview">
                            <div className="team-name">{team.name}</div>
                            <div className="team-members">
                              {team.members.length} / {team.maxMembers} members
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstructorDashboard
