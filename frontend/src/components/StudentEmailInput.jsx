import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentEmailInput = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.get('/api/students');
      const students = response.data;
      const found = students.find(student => student.email === email);
      if (found) {
        localStorage.setItem('studentSignedUp', 'true');
        localStorage.setItem('studentEmail', email);
        navigate('/student-dashboard');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError('Error checking email. Please try again.');
    }
  };

  return (
    <div className="student-email-input">
      <h2>Enter Your Email</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">Continue</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default StudentEmailInput;
