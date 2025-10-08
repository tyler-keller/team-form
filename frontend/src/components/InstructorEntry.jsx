import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const InstructorEntry = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('select') // 'select' | 'create'
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Prefill from localStorage if present
    const savedEmail = localStorage.getItem('instructorEmail') || ''
    if (savedEmail) setEmail(savedEmail)

    // Fetch instructors list to optionally show a dropdown in select mode
    const fetchInstructors = async () => {
      try {
        const res = await axios.get('/api/instructors')
        setInstructors(res.data || [])
      } catch (e) {
        // non-blocking
      }
    }
    fetchInstructors()
  }, [])

  const goToDashboard = (emailToUse) => {
    localStorage.setItem('instructorEmail', emailToUse)
    navigate('/instructor')
  }

  const handleSelectSubmit = (e) => {
    e.preventDefault()
    if (!email) return setError('Please provide an instructor email')
    setError('')
    goToDashboard(email)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name || !email) return setError('Please provide name and email')
    setLoading(true)
    try {
      await axios.post('/api/instructors', { name, email })
      goToDashboard(email)
    } catch (e) {
      setError('Failed to create instructor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-profile-form" style={{ maxWidth: 640 }}>
      <h2>Instructor</h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          className={`submit-button`}
          style={{ opacity: mode === 'select' ? 1 : 0.6 }}
          onClick={() => setMode('select')}
        >
          Select Existing
        </button>
        <button
          type="button"
          className={`submit-button`}
          style={{ opacity: mode === 'create' ? 1 : 0.6 }}
          onClick={() => setMode('create')}
        >
          Create New
        </button>
      </div>

      {mode === 'select' ? (
        <form onSubmit={handleSelectSubmit}>
          <div className="form-group">
            <label htmlFor="instructorEmail">Instructor Email</label>
            <input
              id="instructorEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@example.com"
              required
            />
          </div>

          {instructors.length > 0 && (
            <div className="form-group">
              <label htmlFor="instructorDropdown">Or pick from list</label>
              <select
                id="instructorDropdown"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
                <option value="">-- Select Instructor --</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.email}>
                    {i.name} ({i.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          <button className="submit-button" type="submit">Continue</button>
        </form>
      ) : (
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instructor@example.com"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create and Continue'}
          </button>
        </form>
      )}
    </div>
  )
}

export default InstructorEntry
