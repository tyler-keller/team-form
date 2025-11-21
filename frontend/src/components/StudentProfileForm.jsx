import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './StudentProfileForm.css'

const StudentProfileForm = ({ onSuccess }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    major: '',
    year: '',
    skills: '',
    interests: '',
    availability: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    // Only prefill if editing profile
    if (window.location.pathname === '/edit-profile') {
      setIsEditMode(true);
      const email = localStorage.getItem('studentEmail');
      if (email) {
        setLoading(true);
        fetch(`/api/students`)
          .then(res => res.json())
          .then(students => {
            const student = students.find(s => s.email === email);
            if (student) {
              setFormData({
                name: student.name || '',
                email: student.email || '',
                major: student.major || '',
                year: student.year || '',
                skills: Array.isArray(student.skills) ? student.skills.join(', ') : (student.skills ? JSON.parse(student.skills).join(', ') : ''),
                interests: student.interests || '',
                availability: student.availability ? JSON.parse(student.availability) : {}
              });
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvailabilityChange = (day, timeSlot) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [timeSlot]: !prev.availability[day]?.[timeSlot]
        }
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Convert skills string to array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)

      const studentData = {
        name: formData.name,
        major: formData.major,
        year: formData.year,
        skills: skillsArray,
        availability: formData.availability,
        interests: formData.interests
      }

      let response;
      if (isEditMode) {
        // Update existing student
        response = await axios.put(`/api/students/${encodeURIComponent(formData.email)}`, studentData)
      } else {
        // Create new student
        response = await axios.post('/api/students', {
          ...studentData,
          email: formData.email
        })
        // Mark student as signed up and store email
        localStorage.setItem('studentSignedUp', 'true');
        localStorage.setItem('studentEmail', formData.email);
      }
      
      if (onSuccess) {
        onSuccess(response.data)
      }
      
      // Only reset form if creating new profile, not when editing
      if (!isEditMode) {
        setFormData({
          name: '',
          email: '',
          major: '',
          year: '',
          skills: '',
          interests: '',
          availability: {}
        })
      } else {
        // Show success message and navigate back to dashboard after a short delay
        setError('')
        setSuccessMessage('Profile updated successfully!')
        setTimeout(() => {
          navigate('/student-dashboard')
        }, 1500)
      }
      
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} student:`, error)
      setError(`Failed to ${isEditMode ? 'update' : 'create'} student profile. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-profile-form">
      <h2>{isEditMode ? 'Edit Student Profile' : 'Student Profile'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isEditMode}
            style={isEditMode ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
          />
          {isEditMode && <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>Email cannot be changed</small>}
        </div>

        <div className="form-group">
          <label htmlFor="major">Major</label>
          <input
            type="text"
            id="major"
            name="major"
            value={formData.major}
            onChange={handleInputChange}
            placeholder="e.g., Computer Science"
          />
        </div>

        <div className="form-group">
          <label htmlFor="year">Academic Year</label>
          <select
            id="year"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
          >
            <option value="">Select Year</option>
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Graduate">Graduate</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="skills">Skills (comma-separated)</label>
          <input
            type="text"
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleInputChange}
            placeholder="e.g., JavaScript, Python, Design, Leadership"
          />
        </div>

        <div className="form-group">
          <label htmlFor="interests">Interests</label>
          <textarea
            id="interests"
            name="interests"
            value={formData.interests}
            onChange={handleInputChange}
            placeholder="Tell us about your interests, hobbies, and what you're passionate about..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Availability</label>
          <div className="availability-grid">
            <div className="days-header">
              <div className="time-header"></div>
              {days.map(day => (
                <div key={day} className="day-header">{day}</div>
              ))}
            </div>
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="time-row">
                <div className="time-label">{timeSlot}</div>
                {days.map(day => (
                  <button
                    key={`${day}-${timeSlot}`}
                    type="button"
                    className={`time-slot ${
                      formData.availability[day]?.[timeSlot] ? 'selected' : ''
                    }`}
                    onClick={() => handleAvailabilityChange(day, timeSlot)}
                  >
                    {formData.availability[day]?.[timeSlot] ? '✓' : ''}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div style={{ color: 'green', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>{successMessage}</div>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? (isEditMode ? 'Updating Profile...' : 'Creating Profile...') : (isEditMode ? 'Update Profile' : 'Create Profile')}
        </button>
      </form>
    </div>
  )
}

export default StudentProfileForm
