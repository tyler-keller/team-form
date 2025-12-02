import React, { useState } from 'react';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setSuccess('Registration successful! You can now sign in.');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registration-container">
      <h2>Registration</h2>
      <form className="registration-form" onSubmit={handleSubmit}>
        <label htmlFor="role-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Select a Role
        </label>
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
            minWidth: '180px',
            marginBottom: '1rem'
          }}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
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
    </div>
  );
};

export default RegistrationPage;
