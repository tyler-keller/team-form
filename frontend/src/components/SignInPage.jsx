import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInPage.css';

const SignInPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');

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
      <form className="signin-form" onSubmit={e => e.preventDefault()}>
        <input
          type="email"
          placeholder="Email"
          className="signin-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="signin-input"
          required
        />
        <button type="submit" className="signin-btn" style={{marginTop: '1.5rem'}}>
          Sign In
        </button>
      </form>
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
