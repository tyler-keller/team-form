#!/usr/bin/env node
/**
 * CLI tool for quick project and student management
 * Usage: node scripts/cli.js [command] [options]
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createInstructor() {
  console.log('\n📝 Create New Instructor\n');
  
  const name = await question('Instructor name: ');
  const email = await question('Instructor email: ');
  
  try {
    const instructor = await prisma.instructor.create({
      data: { name, email }
    });
    console.log(`\n✅ Instructor created successfully!`);
    console.log(`   ID: ${instructor.id}`);
    console.log(`   Name: ${instructor.name}`);
    console.log(`   Email: ${instructor.email}`);
    return instructor;
  } catch (error) {
    console.error('❌ Error creating instructor:', error.message);
    return null;
  }
}

async function createCourse() {
  console.log('\n📝 Create New Course\n');
  
  const name = await question('Course name (e.g., "CS 401 - Full-Stack Development"): ');
  
  try {
    const course = await prisma.course.create({
      data: { name }
    });
    console.log(`\n✅ Course created successfully!`);
    console.log(`   ID: ${course.id}`);
    console.log(`   Name: ${course.name}`);
    return course;
  } catch (error) {
    console.error('❌ Error creating course:', error.message);
    return null;
  }
}

async function createProject() {
  console.log('\n📝 Create New Project\n');
  
  // List instructors
  const instructors = await prisma.instructor.findMany();
  if (instructors.length === 0) {
    console.log('❌ No instructors found. Please create an instructor first.');
    return null;
  }
  
  console.log('Available instructors:');
  instructors.forEach((inst, idx) => {
    console.log(`   ${idx + 1}. ${inst.name} (${inst.email})`);
  });
  
  const instructorIdx = parseInt(await question('\nSelect instructor (number): ')) - 1;
  if (instructorIdx < 0 || instructorIdx >= instructors.length) {
    console.log('❌ Invalid selection');
    return null;
  }
  
  const instructor = instructors[instructorIdx];
  
  // Optional: Select course
  const courses = await prisma.course.findMany();
  let selectedCourse = null;
  
  if (courses.length > 0) {
    console.log('\nAvailable courses (or press Enter to skip):');
    courses.forEach((course, idx) => {
      console.log(`   ${idx + 1}. ${course.name}`);
    });
    
    const courseInput = await question('\nSelect course (number or Enter to skip): ');
    if (courseInput.trim()) {
      const courseIdx = parseInt(courseInput) - 1;
      if (courseIdx >= 0 && courseIdx < courses.length) {
        selectedCourse = courses[courseIdx];
      }
    }
  }
  
  const name = await question('\nProject name: ');
  const description = await question('Project description: ');
  const minTeamSize = parseInt(await question('Minimum team size: '));
  const maxTeamSize = parseInt(await question('Maximum team size: '));
  
  console.log('\nEnter student emails (one per line, empty line to finish):');
  const studentEmails = [];
  while (true) {
    const email = await question('  Email: ');
    if (!email.trim()) break;
    studentEmails.push(email.trim());
  }
  
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        minTeamSize,
        maxTeamSize,
        studentEmails: JSON.stringify(studentEmails),
        instructorId: instructor.id,
        courseId: selectedCourse?.id,
        status: 'active'
      },
      include: {
        instructor: true,
        course: true
      }
    });
    
    console.log(`\n✅ Project created successfully!`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Name: ${project.name}`);
    console.log(`   Instructor: ${project.instructor.name}`);
    if (project.course) console.log(`   Course: ${project.course.name}`);
    console.log(`   Students: ${studentEmails.length}`);
    console.log(`   Team size: ${project.minTeamSize}-${project.maxTeamSize}`);
    
    return project;
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    return null;
  }
}

async function createStudent() {
  console.log('\n📝 Create New Student\n');
  
  const name = await question('Student name: ');
  const email = await question('Student email: ');
  const major = await question('Major: ');
  const year = await question('Year (Freshman/Sophomore/Junior/Senior): ');
  const interests = await question('Interests (comma-separated): ');
  
  console.log('\nSkills (comma-separated, e.g., "JavaScript, Python, React"): ');
  const skillsInput = await question('  Skills: ');
  const skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
  
  try {
    const student = await prisma.student.create({
      data: {
        name,
        email,
        major,
        year,
        skills: JSON.stringify(skills),
        interests,
        availability: JSON.stringify({}) // Empty availability for now
      }
    });
    
    console.log(`\n✅ Student created successfully!`);
    console.log(`   ID: ${student.id}`);
    console.log(`   Name: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Major: ${student.major}`);
    
    return student;
  } catch (error) {
    console.error('❌ Error creating student:', error.message);
    return null;
  }
}

async function bulkCreateStudents() {
  console.log('\n📝 Bulk Create Students from CSV-like input\n');
  console.log('Format: name,email,major,year,skills (semicolon-separated)');
  console.log('Example: John Doe,john@student.edu,CS,Junior,JavaScript;Python;React');
  console.log('Enter student data (one per line, empty line to finish):\n');
  
  const students = [];
  while (true) {
    const line = await question('  Student: ');
    if (!line.trim()) break;
    
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) {
      console.log('  ⚠️  Invalid format, skipping...');
      continue;
    }
    
    const [name, email, major = 'Computer Science', year = 'Junior', skillsStr = ''] = parts;
    const skills = skillsStr.split(';').map(s => s.trim()).filter(s => s);
    
    students.push({ name, email, major, year, skills });
  }
  
  if (students.length === 0) {
    console.log('No students to create.');
    return;
  }
  
  console.log(`\nCreating ${students.length} students...`);
  
  let created = 0;
  let failed = 0;
  
  for (const studentData of students) {
    try {
      await prisma.student.create({
        data: {
          ...studentData,
          skills: JSON.stringify(studentData.skills),
          availability: JSON.stringify({}),
          interests: ''
        }
      });
      console.log(`  ✓ Created: ${studentData.name}`);
      created++;
    } catch (error) {
      console.log(`  ✗ Failed: ${studentData.name} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n✅ Bulk creation complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Failed: ${failed}`);
}

async function listProjects() {
  const projects = await prisma.project.findMany({
    include: {
      instructor: true,
      course: true,
      teams: true
    }
  });
  
  console.log(`\n📋 Projects (${projects.length} total)\n`);
  
  projects.forEach(project => {
    const studentEmails = JSON.parse(project.studentEmails || '[]');
    console.log(`ID: ${project.id}`);
    console.log(`Name: ${project.name}`);
    console.log(`Instructor: ${project.instructor.name}`);
    if (project.course) console.log(`Course: ${project.course.name}`);
    console.log(`Students: ${studentEmails.length}`);
    console.log(`Teams: ${project.teams.length}`);
    console.log(`Status: ${project.status}`);
    console.log('---');
  });
}

async function listStudents() {
  const students = await prisma.student.findMany({
    include: {
      teamMemberships: {
        include: {
          team: true
        }
      }
    }
  });
  
  console.log(`\n👨‍🎓 Students (${students.length} total)\n`);
  
  students.forEach(student => {
    console.log(`ID: ${student.id}`);
    console.log(`Name: ${student.name}`);
    console.log(`Email: ${student.email}`);
    console.log(`Major: ${student.major || 'N/A'}`);
    console.log(`Year: ${student.year || 'N/A'}`);
    console.log(`Teams: ${student.teamMemberships.length}`);
    console.log('---');
  });
}

async function showMenu() {
  console.log('\n🛠️  Team Formation CLI Tool\n');
  console.log('1. Create Instructor');
  console.log('2. Create Course');
  console.log('3. Create Project');
  console.log('4. Create Student');
  console.log('5. Bulk Create Students');
  console.log('6. List Projects');
  console.log('7. List Students');
  console.log('8. Exit');
  
  const choice = await question('\nSelect option: ');
  
  switch (choice.trim()) {
    case '1':
      await createInstructor();
      break;
    case '2':
      await createCourse();
      break;
    case '3':
      await createProject();
      break;
    case '4':
      await createStudent();
      break;
    case '5':
      await bulkCreateStudents();
      break;
    case '6':
      await listProjects();
      break;
    case '7':
      await listStudents();
      break;
    case '8':
      console.log('\nGoodbye! 👋\n');
      rl.close();
      await prisma.$disconnect();
      process.exit(0);
      return;
    default:
      console.log('\n❌ Invalid option');
  }
  
  // Show menu again
  await showMenu();
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Interactive mode
    await showMenu();
  } else {
    // Command mode
    const command = args[0];
    
    switch (command) {
      case 'create-instructor':
        await createInstructor();
        break;
      case 'create-course':
        await createCourse();
        break;
      case 'create-project':
        await createProject();
        break;
      case 'create-student':
        await createStudent();
        break;
      case 'list-projects':
        await listProjects();
        break;
      case 'list-students':
        await listStudents();
        break;
      default:
        console.log('Unknown command. Available commands:');
        console.log('  create-instructor');
        console.log('  create-course');
        console.log('  create-project');
        console.log('  create-student');
        console.log('  list-projects');
        console.log('  list-students');
    }
    
    rl.close();
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
