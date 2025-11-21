#!/usr/bin/env node
/**
 * Quick setup script - creates a complete project with instructor, course, and students
 * This is useful for quick testing and development
 * 
 * Usage: node scripts/quick-setup.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const quickSetupData = {
  instructor: {
    name: 'Dr. Jane Smith',
    email: 'jane.smith@university.edu'
  },
  course: {
    name: 'CS 499 - Senior Project'
  },
  project: {
    name: 'AI-Powered Study Assistant',
    description: 'Build an intelligent study assistant that helps students organize notes, create study schedules, and generate practice questions.',
    minTeamSize: 3,
    maxTeamSize: 5
  },
  students: [
    {
      name: 'Alice Thompson',
      email: 'alice.thompson@student.edu',
      major: 'Computer Science',
      year: 'Senior',
      skills: ['React', 'Node.js', 'Python', 'MongoDB'],
      interests: 'AI/ML, Web Development, UI/UX Design'
    },
    {
      name: 'Bob Martinez',
      email: 'bob.martinez@student.edu',
      major: 'Software Engineering',
      year: 'Senior',
      skills: ['Java', 'Spring Boot', 'Docker', 'AWS'],
      interests: 'Cloud Computing, Backend Development, DevOps'
    },
    {
      name: 'Carol Chen',
      email: 'carol.chen@student.edu',
      major: 'Data Science',
      year: 'Junior',
      skills: ['Python', 'TensorFlow', 'Pandas', 'SQL'],
      interests: 'Machine Learning, Data Analysis, Research'
    },
    {
      name: 'David Kim',
      email: 'david.kim@student.edu',
      major: 'Computer Science',
      year: 'Senior',
      skills: ['TypeScript', 'React', 'GraphQL', 'PostgreSQL'],
      interests: 'Full-Stack Development, API Design, Open Source'
    },
    {
      name: 'Eva Rodriguez',
      email: 'eva.rodriguez@student.edu',
      major: 'Computer Engineering',
      year: 'Junior',
      skills: ['C++', 'Python', 'Embedded Systems', 'Git'],
      interests: 'IoT, Robotics, System Programming'
    },
    {
      name: 'Frank Lee',
      email: 'frank.lee@student.edu',
      major: 'Information Systems',
      year: 'Senior',
      skills: ['JavaScript', 'Vue.js', 'Firebase', 'UI/UX'],
      interests: 'Mobile Apps, User Experience, Startups'
    },
    {
      name: 'Grace Wilson',
      email: 'grace.wilson@student.edu',
      major: 'Computer Science',
      year: 'Junior',
      skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
      interests: 'Web Development, Database Design, Security'
    },
    {
      name: 'Henry Patel',
      email: 'henry.patel@student.edu',
      major: 'Software Engineering',
      year: 'Senior',
      skills: ['JavaScript', 'React Native', 'Node.js', 'MongoDB'],
      interests: 'Mobile Development, Cross-Platform, Gaming'
    },
    {
      name: 'Iris Zhang',
      email: 'iris.zhang@student.edu',
      major: 'Data Science',
      year: 'Senior',
      skills: ['R', 'Python', 'Tableau', 'Machine Learning'],
      interests: 'Data Visualization, Statistics, Research'
    },
    {
      name: 'Jack Brown',
      email: 'jack.brown@student.edu',
      major: 'Computer Science',
      year: 'Junior',
      skills: ['Go', 'Docker', 'Kubernetes', 'Microservices'],
      interests: 'Cloud Native, DevOps, Distributed Systems'
    },
    {
      name: 'Kate Anderson',
      email: 'kate.anderson@student.edu',
      major: 'Cybersecurity',
      year: 'Senior',
      skills: ['Python', 'Network Security', 'Penetration Testing', 'Linux'],
      interests: 'Security, Ethical Hacking, Privacy'
    },
    {
      name: 'Leo Garcia',
      email: 'leo.garcia@student.edu',
      major: 'Computer Science',
      year: 'Junior',
      skills: ['Swift', 'iOS Development', 'Firebase', 'SwiftUI'],
      interests: 'Mobile Apps, Apple Ecosystem, Design'
    }
  ]
};

async function quickSetup() {
  console.log('🚀 Running quick setup...\n');
  
  try {
    // Create instructor
    console.log('👨‍🏫 Creating instructor...');
    const instructor = await prisma.instructor.upsert({
      where: { email: quickSetupData.instructor.email },
      update: quickSetupData.instructor,
      create: quickSetupData.instructor
    });
    console.log(`   ✓ Instructor: ${instructor.name}`);
    
    // Create course
    console.log('\n📚 Creating course...');
    const course = await prisma.course.upsert({
      where: { name: quickSetupData.course.name },
      update: quickSetupData.course,
      create: quickSetupData.course
    });
    console.log(`   ✓ Course: ${course.name}`);
    
    // Create students
    console.log('\n👨‍🎓 Creating students...');
    const students = [];
    for (const studentData of quickSetupData.students) {
      const student = await prisma.student.upsert({
        where: { email: studentData.email },
        update: {
          ...studentData,
          skills: JSON.stringify(studentData.skills),
          // where avilability looks like {"Monday":{"9:00 AM":true,"10:00 AM":true},"Wednesday":{"2:00 PM":true,"3:00 PM":true}}
          // fill out with default availability for quick setup
          availability: JSON.stringify({
            Monday: {'9:00 AM': true, '10:00 AM': true},
            Wednesday: {'2:00 PM': true, '3:00 PM': true}
          })
        },
        create: {
          ...studentData,
          skills: JSON.stringify(studentData.skills),
          availability: JSON.stringify({
            Monday: {'9:00 AM': true, '10:00 AM': true},
            Wednesday: {'2:00 PM': true, '3:00 PM': true}
          })
        }
      });
      students.push(student);
      console.log(`   ✓ ${student.name}`);
    }
    
    // Create project
    console.log('\n📋 Creating project...');
    const studentEmails = students.map(s => s.email);
    const project = await prisma.project.create({
      data: {
        name: quickSetupData.project.name,
        description: quickSetupData.project.description,
        minTeamSize: quickSetupData.project.minTeamSize,
        maxTeamSize: quickSetupData.project.maxTeamSize,
        studentEmails: JSON.stringify(studentEmails),
        status: 'active',
        instructorId: instructor.id,
        courseId: course.id
      }
    });
    console.log(`   ✓ Project: ${project.name}`);
    console.log(`   ✓ Assigned ${studentEmails.length} students`);
    
    console.log('\n✨ Quick setup completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Instructor: ${instructor.name} (${instructor.email})`);
    console.log(`   Course: ${course.name}`);
    console.log(`   Project: ${project.name}`);
    console.log(`   Students: ${students.length}`);
    console.log(`   Team size range: ${project.minTeamSize}-${project.maxTeamSize} members\n`);
    console.log('🌐 You can now open the app and see this data!');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:3001\n');
    
  } catch (error) {
    console.error('\n❌ Error during quick setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

quickSetup()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
