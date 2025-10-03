import { useState, useEffect } from 'react'
import axios from 'axios'
import './InstructorDashboard.css'

const InstructorDashboard = () => {
  const [instructors, setInstructors] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newInstructor, setNewInstructor] = useState({ name: '', email: '' })
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    minTeamSize: 3,
    maxTeamSize: 4,
    studentEmails: '',
    instructorId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [instructorsRes, projectsRes] = await Promise.all([
        axios.get('/api/instructors'),
        axios.get('/api/projects')
      ])
      setInstructors(instructorsRes.data)
      setProjects(projectsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInstructor = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/instructors', newInstructor)
      setNewInstructor({ name: '', email: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating instructor:', error)
      setError('Failed to create instructor')
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      const studentEmails = newProject.studentEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0)
      
      const response = await axios.post('/api/projects', {
        ...newProject,
        studentEmails,
        instructorId: parseInt(newProject.instructorId)
      })
      
      setNewProject({
        name: '',
        description: '',
        minTeamSize: 3,
        maxTeamSize: 4,
        studentEmails: '',
        instructorId: ''
      })
      setShowCreateProject(false)
      fetchData()
      
      alert(`Project created! ${response.data.emailsSent} invitation emails sent to students.`)
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create project')
    }
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
      <h2>Instructor Dashboard</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-sections">
        {/* Create Instructor Section */}
        <div className="section">
          <h3>Create Instructor</h3>
          <form onSubmit={handleCreateInstructor} className="instructor-form">
            <div className="form-group">
              <label htmlFor="instructorName">Name</label>
              <input
                type="text"
                id="instructorName"
                value={newInstructor.name}
                onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="instructorEmail">Email</label>
              <input
                type="email"
                id="instructorEmail"
                value={newInstructor.email}
                onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="submit-button">Create Instructor</button>
          </form>
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
              
              <div className="form-group">
                <label htmlFor="instructorSelect">Instructor</label>
                <select
                  id="instructorSelect"
                  value={newProject.instructorId}
                  onChange={(e) => setNewProject({ ...newProject, instructorId: e.target.value })}
                  required
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} ({instructor.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="studentEmails">Student Emails (one per line)</label>
                <textarea
                  id="studentEmails"
                  value={newProject.studentEmails}
                  onChange={(e) => setNewProject({ ...newProject, studentEmails: e.target.value })}
                  rows="5"
                  placeholder="student1@example.com&#10;student2@example.com&#10;student3@example.com"
                  required
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
                    <h4>{project.name}</h4>
                    <span className="project-status">{project.status}</span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-details">
                    <div className="detail-item">
                      <strong>Instructor:</strong> {project.instructor.name}
                    </div>
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
