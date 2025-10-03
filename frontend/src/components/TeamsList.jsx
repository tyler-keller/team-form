import { useState, useEffect } from 'react'
import axios from 'axios'
import './TeamsList.css'

const TeamsList = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/teams')
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
      setError('Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="teams-list">
        <h2>Teams</h2>
        <div className="loading">Loading teams...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="teams-list">
        <h2>Teams</h2>
        <div className="error">{error}</div>
        <button onClick={fetchTeams} className="retry-button">Retry</button>
      </div>
    )
  }

  return (
    <div className="teams-list">
      <div className="teams-header">
        <h2>Teams ({teams.length})</h2>
        <button onClick={fetchTeams} className="refresh-button">Refresh</button>
      </div>
      
      {teams.length === 0 ? (
        <div className="no-teams">No teams found. Create a team to get started!</div>
      ) : (
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-header">
                <h3>{team.name}</h3>
                {team.description && (
                  <p className="team-description">{team.description}</p>
                )}
                <div className="team-meta">
                  <span className="member-count">
                    {team.members?.length || 0} / {team.maxMembers} members
                  </span>
                  <span className="team-created">
                    Created: {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {team.members && team.members.length > 0 && (
                <div className="team-members">
                  <h4>Members:</h4>
                  <div className="members-list">
                    {team.members.map(member => (
                      <div key={member.id} className="member-item">
                        <div className="member-info">
                          <span className="member-name">{member.student.name}</span>
                          <span className="member-email">{member.student.email}</span>
                          {member.role && (
                            <span className="member-role">{member.role}</span>
                          )}
                        </div>
                        {member.student.major && (
                          <div className="member-major">{member.student.major}</div>
                        )}
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
  )
}

export default TeamsList
