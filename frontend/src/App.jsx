
import { Routes, Route } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import InstructorDashboard from './components/InstructorDashboard';
import InstructorEntry from './components/InstructorEntry';
import StudentProfileForm from './components/StudentProfileForm';
import StudentsList from './components/StudentsList';
import CreateTeamForm from './components/CreateTeamForm';
import TeamsList from './components/TeamsList';
import AutoGenerateTeams from './components/AutoGenerateTeams';
import StudentInvitation from './components/StudentInvitation';
import StudentDashboard from './components/StudentDashboard';
import StudentEmailInput from './components/StudentEmailInput';
import './App.css';


function App() {
  return (
    <div className="app">
      <Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/instructor-entry" element={<InstructorEntry />} />
  <Route path="/instructor" element={<InstructorDashboard />} />
  <Route path="/student" element={<StudentProfileForm />} />
  <Route path="/student-dashboard" element={<StudentDashboard />} />
  <Route path="/student-email" element={<StudentEmailInput />} />
  <Route path="/edit-profile" element={<StudentProfileForm />} />
        {/* Add more routes as needed for other views */}
      </Routes>
    </div>
  );
}

export default App;
