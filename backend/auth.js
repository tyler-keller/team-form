const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

async function registerUser(type, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    if (type === 'student') {
      return await prisma.student.create({ data: { email, password: hashedPassword } });
    } else if (type === 'instructor') {
      return await prisma.instructor.create({ data: { email, password: hashedPassword } });
    }
    throw new Error('Invalid user type');
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      throw new Error('Email already registered');
    }
    throw err;
  }
}

async function loginUser(type, email, password) {
  let user;
  if (type === 'student') {
    user = await prisma.student.findUnique({ where: { email } });
  } else if (type === 'instructor') {
    user = await prisma.instructor.findUnique({ where: { email } });
  }
  if (!user) throw new Error('User not found');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid password');
  const token = jwt.sign({ id: user.id, email: user.email, type }, JWT_SECRET, { expiresIn: '1d' });
  return { token, user };
}

module.exports = { registerUser, loginUser };
