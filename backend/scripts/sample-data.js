/**
 * Sample data for seeding the database
 */

const sampleInstructors = [
  {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@university.edu'
  },
  {
    name: 'Prof. Michael Rodriguez',
    email: 'michael.rodriguez@university.edu'
  },
  {
    name: 'Dr. Emily Johnson',
    email: 'emily.johnson@university.edu'
  },
  {
    name: 'Prof. David Kim',
    email: 'david.kim@university.edu'
  }
];

const sampleCourses = [
  { name: 'CS 101 - Introduction to Programming' },
  { name: 'CS 301 - Software Engineering' },
  { name: 'CS 401 - Advanced Full-Stack Development' },
  { name: 'CS 450 - Machine Learning' },
  { name: 'CS 350 - Database Systems' }
];

const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery',
  'Quinn', 'Skylar', 'Reese', 'Cameron', 'Drew', 'Sage', 'Rowan', 'Finley',
  'Kai', 'Phoenix', 'Charlie', 'Blake', 'Dakota', 'River', 'Hayden', 'Peyton',
  'Sam', 'Jesse', 'Parker', 'Logan', 'Harper', 'Emerson', 'Kendall', 'Spencer',
  'Elliot', 'Devon', 'Brooklyn', 'Sawyer', 'Ashton', 'Eden', 'Rory', 'Jules'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const majors = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Computer Engineering',
  'Information Systems',
  'Mathematics',
  'Electrical Engineering',
  'Business Analytics',
  'Cognitive Science',
  'Physics'
];

const years = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

const skillsList = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++',
  'SQL', 'MongoDB', 'Git', 'Docker', 'AWS', 'Machine Learning', 'Data Analysis',
  'UI/UX Design', 'Agile', 'Testing', 'DevOps', 'REST APIs', 'GraphQL'
];

const interestsList = [
  'Web Development', 'Mobile Apps', 'AI/ML', 'Game Development', 'Cybersecurity',
  'Data Science', 'Cloud Computing', 'IoT', 'Blockchain', 'AR/VR',
  'Open Source', 'Startups', 'Research', 'Teaching', 'Competitive Programming'
];

// Generate availability (simplified: just day preferences)
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeBlocks = ['Morning', 'Afternoon', 'Evening', 'Night'];

function generateRandomAvailability() {
  const availability = {};
  const numDays = Math.floor(Math.random() * 4) + 3; // 3-6 days
  const selectedDays = [...days].sort(() => 0.5 - Math.random()).slice(0, numDays);
  
  selectedDays.forEach(day => {
    const numBlocks = Math.floor(Math.random() * 2) + 1; // 1-2 time blocks per day
    availability[day] = [...timeBlocks].sort(() => 0.5 - Math.random()).slice(0, numBlocks);
  });
  
  return availability;
}

function generateRandomSkills() {
  const numSkills = Math.floor(Math.random() * 5) + 3; // 3-7 skills
  return [...skillsList].sort(() => 0.5 - Math.random()).slice(0, numSkills);
}

function generateRandomInterests() {
  const numInterests = Math.floor(Math.random() * 4) + 2; // 2-5 interests
  return [...interestsList].sort(() => 0.5 - Math.random()).slice(0, numInterests).join(', ');
}

// Generate 50 sample students
const sampleStudents = [];
for (let i = 0; i < 50; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.edu`;
  
  sampleStudents.push({
    name: `${firstName} ${lastName}`,
    email: email,
    major: majors[Math.floor(Math.random() * majors.length)],
    year: years[Math.floor(Math.random() * years.length)],
    skills: generateRandomSkills(),
    availability: generateRandomAvailability(),
    interests: generateRandomInterests()
  });
}

const sampleProjects = [
  {
    name: 'E-Commerce Platform Development',
    description: 'Build a full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.',
    minTeamSize: 3,
    maxTeamSize: 5,
    instructorEmail: 'sarah.chen@university.edu',
    courseName: 'CS 401 - Advanced Full-Stack Development',
    studentStartIndex: 0,
    studentCount: 20,
    status: 'active'
  },
  {
    name: 'Machine Learning Research Project',
    description: 'Develop and train machine learning models for image classification using deep learning techniques.',
    minTeamSize: 2,
    maxTeamSize: 4,
    instructorEmail: 'michael.rodriguez@university.edu',
    courseName: 'CS 450 - Machine Learning',
    studentStartIndex: 20,
    studentCount: 16,
    status: 'active'
  },
  {
    name: 'Mobile Health Tracking App',
    description: 'Create a cross-platform mobile application for tracking fitness activities, nutrition, and health metrics.',
    minTeamSize: 3,
    maxTeamSize: 4,
    instructorEmail: 'emily.johnson@university.edu',
    courseName: 'CS 301 - Software Engineering',
    studentStartIndex: 36,
    studentCount: 12,
    status: 'active'
  },
  {
    name: 'Database Design Challenge',
    description: 'Design and implement a scalable database system for a social media platform with optimization focus.',
    minTeamSize: 2,
    maxTeamSize: 3,
    instructorEmail: 'david.kim@university.edu',
    courseName: 'CS 350 - Database Systems',
    studentStartIndex: 0,
    studentCount: 15,
    status: 'active'
  }
];

module.exports = {
  sampleInstructors,
  sampleCourses,
  sampleStudents,
  sampleProjects
};
