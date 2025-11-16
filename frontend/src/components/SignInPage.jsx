import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInPage.css';

const SignInPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="signin-container">
      <h2>Sign In</h2>
    <div className="signin-options" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
      <label htmlFor="role-select" style={{ marginBottom: '0.75rem', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>
        Select a Role
      </label>
      <select
        id="role-select"
        className="signin-input"
        value={selectedRole}
        onChange={e => setSelectedRole(e.target.value)}
        style={{ marginBottom: '1rem', textAlign: 'center' }}
      >
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
      </select>
    </div>
      <form className="signin-form" onSubmit={async e => {
        e.preventDefault();
        setError('');
        try {
          const res = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: selectedRole, email, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Login failed');
          localStorage.setItem('token', data.token);
          setEmail('');
          setPassword('');
          // Redirect based on role
          if (selectedRole === 'instructor') {
            navigate('/instructor');
          } else {
            navigate('/student-dashboard');
          }
        } catch (err) {
          setError(err.message);
        }
      }}>
        <input
          type="email"
          placeholder="Email"
          className="signin-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="signin-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="signin-btn" style={{marginTop: '1.5rem'}}>
          Sign In
        </button>
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
          Invalid username or password
        </div>
      )}
      <div className="signup-link-container" style={{ marginTop: '1.5rem' }}>
        <button
          className="signup-link"
          type="button"
          onClick={() => navigate(`/register/${selectedRole}`)}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
