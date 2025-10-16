import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './StudentProfileForm.css'

const StudentProfileForm = ({ onSuccess }) => {
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
  const [isEditMode, setIsEditMode] = useState(false)
  const [studentId, setStudentId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Prefill email from localStorage for both create and edit flows
    const emailFromStorage = localStorage.getItem('studentEmail')
    if (emailFromStorage) {
      setFormData(prev => ({ ...prev, email: emailFromStorage }))
    }

    // Only prefill full data if editing profile
    const editing = window.location.pathname === '/edit-profile'
    setIsEditMode(editing)
    if (editing && emailFromStorage) {
      setLoading(true);
      fetch(`/api/students`)
        .then(res => res.json())
        .then(students => {
          const student = students.find(s => s.email === emailFromStorage);
          if (student) {
            setStudentId(student.id)
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
        ...formData,
        skills: skillsArray,
        availability: formData.availability
      }

      let response
      if (isEditMode && studentId) {
        response = await axios.put(`/api/students/${studentId}`, studentData)
      } else {
        response = await axios.post('/api/students', studentData)
      }
      
      if (onSuccess) {
        onSuccess(response.data)
      }
      if (isEditMode) {
        navigate('/student-dashboard')
      }
      // Mark student as signed up and store email only on create
      if (!isEditMode) {
        localStorage.setItem('studentSignedUp', 'true');
        localStorage.setItem('studentEmail', formData.email);
        navigate('/student-dashboard')
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        major: '',
        year: '',
        skills: '',
        interests: '',
        availability: {}
      })
      
    } catch (error) {
      console.error('Error creating student:', error)
      setError('Failed to create student profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-profile-form">
      <h2>Student Profile</h2>
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
            readOnly
            required
          />
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

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? (isEditMode ? 'Updating Profile...' : 'Creating Profile...') : (isEditMode ? 'Update Profile' : 'Create Profile')}
        </button>
      </form>
    </div>
  )
}

export default StudentProfileForm
