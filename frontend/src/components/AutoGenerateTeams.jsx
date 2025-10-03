import { useState } from 'react'
import axios from 'axios'
import './AutoGenerateTeams.css'

const AutoGenerateTeams = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teamSize, setTeamSize] = useState(4)
  const [maxTeams, setMaxTeams] = useState(10)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/api/teams/auto-generate', {
        teamSize: parseInt(teamSize),
        maxTeams: parseInt(maxTeams)
      })

      setSuccess(response.data.message)
      
      if (onSuccess) {
        onSuccess(response.data.teams)
      }
      
    } catch (error) {
      console.error('Error auto-generating teams:', error)
      setError('Failed to auto-generate teams. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auto-generate-teams">
      <h2>Auto-Generate Teams</h2>
      <p className="description">
        Automatically create balanced teams based on student skills and availability.
        The algorithm will try to distribute skills evenly and ensure similar availability across teams.
      </p>
      
      <div className="settings">
        <div className="setting-group">
          <label htmlFor="teamSize">Team Size</label>
          <select
            id="teamSize"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            disabled={loading}
          >
            <option value={3}>3 members</option>
            <option value={4}>4 members</option>
            <option value={5}>5 members</option>
            <option value={6}>6 members</option>
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="maxTeams">Maximum Teams</label>
          <input
            type="number"
            id="maxTeams"
            value={maxTeams}
            onChange={(e) => setMaxTeams(e.target.value)}
            min="1"
            max="20"
            disabled={loading}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className="generate-button"
      >
        {loading ? 'Generating Teams...' : 'Auto-Generate Teams'}
      </button>

      <div className="algorithm-info">
        <h3>How it works:</h3>
        <ul>
          <li>📊 Analyzes student skills and availability</li>
          <li>🎯 Groups students into balanced teams</li>
          <li>⚖️ Distributes skills evenly across teams</li>
          <li>⏰ Ensures similar availability patterns</li>
          <li>🔄 Optimizes team composition through iterative balancing</li>
        </ul>
      </div>
    </div>
  )
}

export default AutoGenerateTeams
