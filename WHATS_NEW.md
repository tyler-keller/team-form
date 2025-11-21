# Developer Tooling - What's New

This document summarizes the new developer tools added to streamline development and testing.

## 🎯 Quick Start

```bash
cd backend
npm run quick-setup
npm run dev
```

That's it! You now have a working app with sample data.

---

## 📦 What Was Added

### New Scripts (in `backend/scripts/`)

1. **`quick-setup.js`** - Fast setup with minimal sample data
   - Creates 1 instructor, 1 course, 1 project, 12 students
   - Perfect for demos and quick testing
   - Run with: `npm run quick-setup`

2. **`seed.js`** - Comprehensive database seeding
   - Creates 4 instructors, 5 courses, 4 projects, 50 students
   - Diverse, randomized student profiles
   - Run with: `npm run seed`
   - ⚠️ Clears existing data first

3. **`cli.js`** - Interactive CLI tool
   - Menu-driven interface for creating data
   - Supports bulk operations
   - Run with: `npm run cli`
   - Available commands:
     - Create instructor
     - Create course
     - Create project
     - Create student
     - Bulk create students
     - List projects
     - List students

4. **`sample-data.js`** - Sample data definitions
   - Configurable sample data
   - Easy to customize for your needs
   - Used by both `seed.js` and `quick-setup.js`

### New NPM Scripts (in `backend/package.json`)

```json
{
  "seed": "node scripts/seed.js",
  "quick-setup": "node scripts/quick-setup.js",
  "cli": "node scripts/cli.js",
  "db:reset": "rm -f prisma/dev.db && npm run db:push && npm run seed"
}
```

### New Documentation

1. **`DEVELOPER_TOOLING.md`** (project root)
   - Comprehensive guide to all developer tools
   - Detailed workflows and examples
   - Tips and troubleshooting

2. **`backend/scripts/README.md`**
   - Detailed script documentation
   - Usage examples
   - Customization guide

3. **`backend/QUICK_REFERENCE.md`**
   - One-page reference card
   - All commands at a glance
   - Common workflows

4. **`API_TESTING.md`** (project root)
   - curl command examples
   - Complete API testing guide
   - Troubleshooting tips

### Other Files

- **`dev-cli.js`** (project root) - Wrapper to run CLI from anywhere
- Updated **`README.md`** with developer tools section

---

## 🎨 Sample Data Overview

### Quick Setup Data

**Instructor:**
- Dr. Jane Smith (jane.smith@university.edu)

**Course:**
- CS 499 - Senior Project

**Project:**
- AI-Powered Study Assistant
- Team size: 3-5 members

**Students (12 with diverse skills):**
1. Alice Thompson - React, Node.js, Python, MongoDB
2. Bob Martinez - Java, Spring Boot, Docker, AWS
3. Carol Chen - Python, TensorFlow, Pandas, SQL
4. David Kim - TypeScript, React, GraphQL, PostgreSQL
5. Eva Rodriguez - C++, Python, Embedded Systems, Git
6. Frank Lee - JavaScript, Vue.js, Firebase, UI/UX
7. Grace Wilson - Python, Django, PostgreSQL, REST APIs
8. Henry Patel - JavaScript, React Native, Node.js, MongoDB
9. Iris Zhang - R, Python, Tableau, Machine Learning
10. Jack Brown - Go, Docker, Kubernetes, Microservices
11. Kate Anderson - Python, Network Security, Penetration Testing
12. Leo Garcia - Swift, iOS Development, Firebase, SwiftUI

### Seed Script Data

**Instructors (4):**
- Dr. Sarah Chen
- Prof. Michael Rodriguez
- Dr. Emily Johnson
- Prof. David Kim

**Courses (5):**
- CS 101 - Introduction to Programming
- CS 301 - Software Engineering
- CS 401 - Advanced Full-Stack Development
- CS 450 - Machine Learning
- CS 350 - Database Systems

**Projects (4):**
1. E-Commerce Platform Development (20 students)
2. Machine Learning Research Project (16 students)
3. Mobile Health Tracking App (12 students)
4. Database Design Challenge (15 students)

**Students (50):**
- Randomized realistic names
- 10 different majors
- 3-7 random skills per student
- 2-5 random interests per student
- Random availability schedules

---

## 🚀 Common Use Cases

### 1. First Time Setup

```bash
cd backend
npm run db:push          # Create database
npm run quick-setup      # Add sample data
npm run dev             # Start server
```

### 2. Testing at Scale

```bash
cd backend
npm run seed            # Seed with 50 students
npm run dev
```

### 3. Custom Test Scenario

```bash
cd backend
npm run cli
# Select options from menu to create custom data
```

### 4. Reset Everything

```bash
cd backend
npm run db:reset        # Delete all, recreate, reseed
```

### 5. View Database

```bash
cd backend
npm run db:studio       # Opens at http://localhost:5555
```

### 6. Interactive Data Creation

```bash
cd backend
npm run cli

# Example bulk student creation:
# John Doe,john@student.edu,CS,Junior,JavaScript;Python;React
# Jane Smith,jane@student.edu,Data Science,Senior,Python;SQL
```

---

## 💡 Key Features

### CLI Tool Features

- ✅ Interactive menu-driven interface
- ✅ Create instructors with validation
- ✅ Create courses
- ✅ Create projects with instructor/course selection
- ✅ Create individual students
- ✅ Bulk create students from CSV-like format
- ✅ List all projects and students
- ✅ Can be used alongside web app

### Seed Script Features

- ✅ Generates realistic diverse data
- ✅ 50 students with unique combinations
- ✅ Random skill sets from 20+ skills
- ✅ Random availability schedules
- ✅ Multiple projects across different courses
- ✅ Proper distribution of students to projects

### Quick Setup Features

- ✅ Fast execution (< 1 second)
- ✅ Minimal but complete data set
- ✅ Ready-to-use for demos
- ✅ Well-documented student profiles
- ✅ Covers all major use cases

---

## 📚 Documentation Structure

```
team-form/
├── DEVELOPER_TOOLING.md        # Main developer guide
├── API_TESTING.md              # curl command examples
├── README.md                   # Updated with dev tools section
└── backend/
    ├── QUICK_REFERENCE.md      # One-page cheat sheet
    └── scripts/
        ├── README.md           # Detailed script docs
        ├── quick-setup.js      # Fast setup script
        ├── seed.js             # Full seed script
        ├── cli.js              # Interactive CLI
        └── sample-data.js      # Data definitions
```

---

## 🎯 Benefits

### Before
- ❌ Had to manually create instructors through web UI
- ❌ Had to manually create projects through web UI
- ❌ Had to manually enter student data through forms
- ❌ Time-consuming to set up test scenarios
- ❌ Hard to test with realistic data at scale

### After
- ✅ One command to set up everything: `npm run quick-setup`
- ✅ Generate 50+ students instantly: `npm run seed`
- ✅ Interactive CLI for custom scenarios: `npm run cli`
- ✅ Easy to reset and start fresh: `npm run db:reset`
- ✅ Visual database browser: `npm run db:studio`
- ✅ Well-documented with examples

---

## 🔧 Customization

### Modify Sample Data

Edit `backend/scripts/sample-data.js`:

```javascript
// Add your own instructor
sampleInstructors.push({
  name: 'Your Name',
  email: 'your.email@university.edu'
});

// Add your own course
sampleCourses.push({
  name: 'CS 999 - Your Course'
});

// Customize project
sampleProjects.push({
  name: 'Your Project',
  description: 'Project description',
  minTeamSize: 3,
  maxTeamSize: 5,
  instructorEmail: 'your.email@university.edu',
  courseName: 'CS 999 - Your Course',
  studentStartIndex: 0,
  studentCount: 20
});
```

### Add New Skills/Interests

Edit arrays in `sample-data.js`:

```javascript
const skillsList = [
  'JavaScript', 'Python', 'React',
  // Add more skills here
  'Rust', 'Solidity', 'WebAssembly'
];

const interestsList = [
  'Web Development', 'AI/ML',
  // Add more interests here
  'Quantum Computing', 'AR/VR'
];
```

---

## 🐛 Troubleshooting

### Database doesn't exist
```bash
cd backend
npm run db:push
```

### Email already exists
```bash
cd backend
npm run db:reset
```

### Scripts not found
Make sure you're in the backend directory:
```bash
cd backend
npm run quick-setup
```

### Want to see what's in the database?
```bash
cd backend
npm run db:studio
```

---

## 📊 Comparison of Tools

| Tool | Best For | Data Created | Clears Data? | Speed |
|------|----------|--------------|--------------|-------|
| `quick-setup` | First-time setup, demos | 1 instructor, 1 course, 1 project, 12 students | No | ⚡ Very fast |
| `seed` | Scale testing, diverse data | 4 instructors, 5 courses, 4 projects, 50 students | Yes ⚠️ | ⚡ Fast |
| `cli` | Custom scenarios | Whatever you create | No | 🐢 Interactive |
| `db:reset` | Nuclear option | Same as seed | Yes ⚠️ | ⚡ Fast |
| `db:studio` | View/edit data | N/A | No | N/A |

---

## 🎓 Learning Path

1. **Start here**: Run `npm run quick-setup` to see how it works
2. **Explore**: Open `http://localhost:5173` and browse the app
3. **View data**: Run `npm run db:studio` to see what was created
4. **Test scale**: Run `npm run seed` to see lots of data
5. **Customize**: Use `npm run cli` to add your own data
6. **Modify**: Edit `sample-data.js` to customize sample data
7. **Reset**: Use `npm run db:reset` when you want fresh data

---

## 📞 Quick Reference

```bash
# Setup
npm run quick-setup    # Fast setup (recommended first time)
npm run seed          # Full seed with 50 students (clears data)
npm run cli           # Interactive menu

# Database
npm run db:studio     # Visual browser (http://localhost:5555)
npm run db:reset      # Delete all & reseed
npm run db:push       # Update schema

# Server
npm run dev          # Start backend server
```

---

## ✨ Next Steps

Now that you have these tools:

1. Use `quick-setup` for your daily development
2. Use `seed` when testing with realistic scale
3. Use `cli` when you need specific test cases
4. Share these tools with your team
5. Customize `sample-data.js` for your specific needs

Happy coding! 🚀
