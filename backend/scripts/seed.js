/**
 * Seed script for populating the database with sample data
 * Run with: node scripts/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { sampleInstructors, sampleCourses, sampleStudents, sampleProjects } = require('./sample-data');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.student.deleteMany();
  await prisma.project.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructor.deleteMany();
  console.log('✅ Database cleared');
}

async function seedInstructors() {
  console.log('\n👨‍🏫 Seeding instructors...');
  const instructors = [];
  for (const instructorData of sampleInstructors) {
    const instructor = await prisma.instructor.create({
      data: instructorData
    });
    instructors.push(instructor);
    console.log(`   ✓ Created instructor: ${instructor.name}`);
  }
  return instructors;
}

async function seedCourses() {
  console.log('\n📚 Seeding courses...');
  const courses = [];
  for (const courseData of sampleCourses) {
    const course = await prisma.course.create({
      data: courseData
    });
    courses.push(course);
    console.log(`   ✓ Created course: ${course.name}`);
  }
  return courses;
}

async function seedStudents() {
  console.log('\n👨‍🎓 Seeding students...');
  const students = [];
  for (const studentData of sampleStudents) {
    const student = await prisma.student.create({
      data: {
        ...studentData,
        skills: JSON.stringify(studentData.skills),
        availability: JSON.stringify(studentData.availability)
      }
    });
    students.push(student);
    console.log(`   ✓ Created student: ${student.name}`);
  }
  return students;
}

async function seedProjects(instructors, courses, students) {
  console.log('\n📋 Seeding projects...');
  const projects = [];
  
  for (const projectData of sampleProjects) {
    const instructor = instructors.find(i => i.email === projectData.instructorEmail);
    const course = courses.find(c => c.name === projectData.courseName);
    
    if (!instructor) {
      console.log(`   ⚠️  Skipping project ${projectData.name} - instructor not found`);
      continue;
    }

    // Get student emails for this project
    const studentEmails = students
      .slice(projectData.studentStartIndex, projectData.studentStartIndex + projectData.studentCount)
      .map(s => s.email);

    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        description: projectData.description,
        minTeamSize: projectData.minTeamSize,
        maxTeamSize: projectData.maxTeamSize,
        studentEmails: JSON.stringify(studentEmails),
        status: projectData.status || 'active',
        instructorId: instructor.id,
        courseId: course?.id
      }
    });
    projects.push(project);
    console.log(`   ✓ Created project: ${project.name} (${studentEmails.length} students)`);
  }
  
  return projects;
}

async function main() {
  try {
    console.log('🌱 Starting database seed...\n');
    
    await clearDatabase();
    
    const instructors = await seedInstructors();
    const courses = await seedCourses();
    const students = await seedStudents();
    const projects = await seedProjects(instructors, courses, students);
    
    console.log('\n✨ Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Instructors: ${instructors.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Projects: ${projects.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
