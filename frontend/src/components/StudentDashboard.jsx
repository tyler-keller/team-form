import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get student email from localStorage or other auth context
    const email = localStorage.getItem('studentEmail');
    setStudentEmail(email);
    fetchProjects(email);
  }, []);

  const fetchProjects = async (email) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects');
      // Filter projects where student is a member
      const filtered = response.data.filter(project =>
        project.teams.some(team =>
          team.members.some(member => member.student?.email === email)
        )
      );
      setProjects(filtered);
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-dashboard">
      <h2>Student Dashboard</h2>
      <button onClick={() => navigate('/edit-profile')} className="edit-profile-btn">Edit Profile</button>
      <h3>Your Projects</h3>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        projects.length > 0 ? (
          <ul>
            {projects.map((project, idx) => (
              <li key={project.id || idx}>{project.name}</li>
            ))}
          </ul>
        ) : (
          <p>No projects assigned yet.</p>
        )
      )}
    </div>
  );
};

export default StudentDashboard;
