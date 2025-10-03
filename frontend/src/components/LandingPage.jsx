import React from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <nav className="navbar">
        <h1 className="logo">Team Formation App</h1>
        <div className="nav-buttons">
          <button onClick={() => navigate('/instructor')} className="nav-btn">Instructor View</button>
          <button onClick={() => navigate('/student')} className="nav-btn">Student View</button>
        </div>
      </nav>
      <main className="main-content">
        <h2>Welcome to the Team Formation App</h2>
        <p>Effortlessly create, manage, and join student teams for your class projects.</p>
      </main>
    </div>
  );
};

export default LandingPage;
