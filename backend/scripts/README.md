# Developer Scripts

This directory contains utility scripts for quickly setting up and managing the team formation application during development.

## Available Scripts

### 1. Quick Setup (`quick-setup.js`)

**Best for:** Getting started immediately with a working example

Creates a complete working setup with one instructor, one course, one project, and 12 students. Perfect for quick testing.

```bash
node scripts/quick-setup.js
```

This creates:
- 1 instructor (Dr. Jane Smith)
- 1 course (CS 499 - Senior Project)
- 1 project (AI-Powered Study Assistant)
- 12 students with diverse skills and interests

### 2. Database Seed (`seed.js`)

**Best for:** Populating with comprehensive sample data

Seeds the database with multiple instructors, courses, projects, and 50 students. Great for testing at scale.

```bash
node scripts/seed.js
```

This creates:
- 4 instructors
- 5 courses
- 4 projects
- 50 students with randomized profiles

**Note:** This script clears all existing data first!

### 3. Interactive CLI (`cli.js`)

**Best for:** Creating custom data interactively

An interactive command-line tool for creating and managing data with full control.

```bash
# Interactive mode (menu-driven)
node scripts/cli.js

# Direct commands
node scripts/cli.js create-instructor
node scripts/cli.js create-course
node scripts/cli.js create-project
node scripts/cli.js create-student
node scripts/cli.js list-projects
node scripts/cli.js list-students
```

Features:
- ✅ Create instructors
- ✅ Create courses
- ✅ Create projects (with instructor and course selection)
- ✅ Create individual students
- ✅ Bulk create students (CSV-like format)
- ✅ List all projects and students

### Bulk Student Creation Format

When using the CLI's bulk create feature, use this format:

```
name,email,major,year,skills
```

Example:
```
John Doe,john@student.edu,Computer Science,Junior,JavaScript;Python;React
Jane Smith,jane@student.edu,Data Science,Senior,Python;TensorFlow;SQL
```

Skills are separated by semicolons (`;`).

## Sample Data Files

### `sample-data.js`

Contains all the sample data used by the seed script:
- Instructor profiles
- Course names
- Student generator with:
  - 40 first names and 40 last names for variety
  - 10 different majors
  - 20+ skills
  - 15+ interest areas
  - Random availability generation
- Project templates

You can modify this file to customize the sample data to your needs.

## Typical Workflow

### First Time Setup

1. **Quick start** (recommended for first time):
   ```bash
   node scripts/quick-setup.js
   ```

2. **Or, for more data**:
   ```bash
   node scripts/seed.js
   ```

### Development

1. **Add specific data interactively**:
   ```bash
   node scripts/cli.js
   ```

2. **View current data**:
   ```bash
   node scripts/cli.js list-projects
   node scripts/cli.js list-students
   ```

### Testing Different Scenarios

1. **Reset and seed**:
   ```bash
   node scripts/seed.js
   ```

2. **Add custom test case**:
   ```bash
   node scripts/cli.js create-project
   ```

## Database Management

### View Database

```bash
cd backend
npm run db:studio
```

This opens Prisma Studio in your browser for visual database management.

### Reset Database

```bash
cd backend
rm prisma/dev.db
npm run db:push
node scripts/seed.js
```

## Tips

- **Quick Setup** is great for demos and initial testing
- **Seed Script** is perfect for testing with realistic data at scale
- **CLI Tool** gives you fine-grained control when you need specific test cases
- All scripts use `upsert` where possible to avoid duplicate key errors
- Student emails are auto-generated to avoid conflicts in bulk operations

## Adding Your Own Sample Data

Edit `sample-data.js` to customize:

1. **Add more instructors**: Add to `sampleInstructors` array
2. **Add courses**: Add to `sampleCourses` array
3. **Modify student profiles**: Edit the generator functions
4. **Create project templates**: Add to `sampleProjects` array

Example:
```javascript
sampleProjects.push({
  name: 'My Custom Project',
  description: 'Project description',
  minTeamSize: 2,
  maxTeamSize: 4,
  instructorEmail: 'instructor@university.edu',
  courseName: 'CS 101 - Introduction to Programming',
  studentStartIndex: 0,
  studentCount: 20,
  status: 'active'
});
```
