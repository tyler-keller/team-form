import React from 'react';
import './RegistrationPage.css';

const RegistrationPage = ({ userType }) => {
  return (
    <div className="registration-container">
      <h2>{userType === 'instructor' ? 'Instructor' : 'Student'} Registration</h2>
      <form className="registration-form">
        <input type="email" placeholder="Email" className="registration-input" required />
        <input type="password" placeholder="Password" className="registration-input" required />
        <button type="submit" className="registration-btn">Sign Up</button>
      </form>
    </div>
  );
};

export default RegistrationPage;
