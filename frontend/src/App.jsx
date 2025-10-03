
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import InstructorDashboard from './components/InstructorDashboard';
import StudentProfileForm from './components/StudentProfileForm';
import StudentsList from './components/StudentsList';
import CreateTeamForm from './components/CreateTeamForm';
import TeamsList from './components/TeamsList';
import AutoGenerateTeams from './components/AutoGenerateTeams';
import StudentInvitation from './components/StudentInvitation';
import './App.css';


function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/student" element={<StudentProfileForm />} />
        {/* Add more routes as needed for other views */}
      </Routes>
    </div>
  );
}

export default App;
