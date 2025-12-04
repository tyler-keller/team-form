import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedRole, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      // Redirect based on role
      if (selectedRole === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signin-container">
      <h2>Login</h2>
      <form className="signin-form" onSubmit={handleSubmit}>
        <label htmlFor="role-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Select a Role
        </label>
        <select
          id="role-select"
          className="registration-input"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #ccc',
            fontSize: '1rem',
            outline: 'none',
            minWidth: '180px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
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
          Login
        </button>
      </form>
      {error && <div style={{color:'red',marginTop:'1rem'}}>{error}</div>}
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

export default LoginPage;
