import { useState, useEffect } from 'react'
import axios from 'axios'
import StudentProfileForm from './components/StudentProfileForm'
import StudentsList from './components/StudentsList'
import CreateTeamForm from './components/CreateTeamForm'
import TeamsList from './components/TeamsList'
import AutoGenerateTeams from './components/AutoGenerateTeams'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('form')
  const [successMessage, setSuccessMessage] = useState('')

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/hello')
      setMessage(response.data.message)
    } catch (error) {
      setMessage('Failed to connect to backend')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  const handleStudentCreated = (student) => {
    setSuccessMessage(`Profile created successfully for ${student.name}!`)
    setActiveTab('students')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const handleTeamCreated = (team) => {
    setSuccessMessage(`Team "${team.name}" created successfully!`)
    setActiveTab('teams')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const handleTeamsGenerated = (teams) => {
    setSuccessMessage(`${teams.length} teams generated successfully!`)
    setActiveTab('teams')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Student Team Creation Tool</h1>
        
        <div className="connection-test">
          <h2>Backend Connection Test</h2>
          {loading ? (
            <p>Testing connection...</p>
          ) : (
            <div>
              <p className="message">{message}</p>
              <button onClick={testConnection} className="test-button">
                Test Again
              </button>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <div className="navigation">
          <button 
            className={`nav-button ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Create Profile
          </button>
          <button 
            className={`nav-button ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            View Students
          </button>
          <button 
            className={`nav-button ${activeTab === 'create-team' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-team')}
          >
            Create Team
          </button>
          <button 
            className={`nav-button ${activeTab === 'auto-generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto-generate')}
          >
            Auto-Generate
          </button>
          <button 
            className={`nav-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            View Teams
          </button>
        </div>

        {activeTab === 'form' && (
          <StudentProfileForm onSuccess={handleStudentCreated} />
        )}

        {activeTab === 'students' && (
          <StudentsList />
        )}

        {activeTab === 'create-team' && (
          <CreateTeamForm onSuccess={handleTeamCreated} />
        )}

        {activeTab === 'auto-generate' && (
          <AutoGenerateTeams onSuccess={handleTeamsGenerated} />
        )}

        {activeTab === 'teams' && (
          <TeamsList />
        )}
      </header>
    </div>
  )
}

export default App
