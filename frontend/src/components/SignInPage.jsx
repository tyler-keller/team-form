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
      <div className="signin-options">
        <button
          className={`signin-btn${selectedRole === 'instructor' ? ' selected' : ''}`}
          onClick={() => setSelectedRole('instructor')}
          type="button"
        >
          Instructor Sign In
        </button>
        <button
          className={`signin-btn${selectedRole === 'student' ? ' selected' : ''}`}
          onClick={() => setSelectedRole('student')}
          type="button"
        >
          Student Sign In
        </button>
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
      {error && <div style={{color:'red',marginTop:'1rem'}}>{error}</div>}
      <div className="signup-link-container">
        <button
          className="signup-link"
          type="button"
          onClick={() => navigate('/register/instructor')}
        >
          Instructor Sign Up
        </button>
        <button
          className="signup-link"
          type="button"
          onClick={() => navigate('/register/student')}
        >
          Student Sign Up
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
