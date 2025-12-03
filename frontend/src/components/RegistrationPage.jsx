import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const { role } = useParams();
  const location = useLocation();
  // Get role from URL param, location state, or default to 'student'
  // Validate that role is either 'student' or 'instructor'
  const roleFromUrl = role && (role === 'student' || role === 'instructor') ? role : null;
  const initialRole = roleFromUrl || location.state?.role || 'student';
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update role if URL param changes
  useEffect(() => {
    if (roleFromUrl) {
      setSelectedRole(roleFromUrl);
    } else if (location.state?.role) {
      setSelectedRole(location.state.role);
    }
  }, [roleFromUrl, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedRole, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess('Registration successful! Redirecting to sign in...');
      setEmail('');
      setPassword('');
      // Redirect to sign-in page after a short delay, preserving the role
      setTimeout(() => {
        navigate('/sign-in', { state: { role: selectedRole } });
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registration-container">
      <h2>Registration</h2>
      <form className="registration-form" onSubmit={handleSubmit}>
        <label htmlFor="role-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>
          Select a Role
        </label>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <select
            id="role-select"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #ccc',
              fontSize: '1rem',
              outline: 'none',
              minWidth: '220px',
              width: '220px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>
        <input type="email" placeholder="Email" className="registration-input" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="registration-input" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="registration-btn">Sign Up</button>
      </form>
      {error && (
        <div
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '1rem',
            padding: '0.75rem 1.5rem',
            marginTop: '1rem',
            display: 'inline-block',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            borderRadius: '1rem',
            padding: '0.75rem 1.5rem',
            marginTop: '1rem',
            display: 'inline-block',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          {success}
        </div>
      )}
      <div className="signin-link-container" style={{ marginTop: '1.5rem' }}>
        <button
          className="signin-link"
          type="button"
          onClick={() => navigate('/sign-in', { state: { role: selectedRole } })}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};

export default RegistrationPage;
