import React from 'react';
import './RegistrationPage.css';

const RegistrationPage = ({ userType }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: userType, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess('Registration successful! You can now sign in.');
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="registration-container">
      <h2>{userType === 'instructor' ? 'Instructor' : 'Student'} Registration</h2>
      <form className="registration-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" className="registration-input" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="registration-input" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="registration-btn">Sign Up</button>
      </form>
      {error && <div style={{color:'red',marginTop:'1rem'}}>{error}</div>}
      {success && <div style={{color:'green',marginTop:'1rem'}}>{success}</div>}
    </div>
  );
};

export default RegistrationPage;
