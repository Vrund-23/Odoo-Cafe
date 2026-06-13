import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';

export const registerUser = async (data) => {
  const { name, email, password, role } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id);

  return {
    user,
    token,
  };
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const getAllUsers = async (limit = 10, page = 1) => {
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    where: { isArchived: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    skip,
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count({
    where: { isArchived: false },
  });

  return { users, total };
};

export const updateUser = async (userId, data) => {
  const { name, email, password, role } = data;

  const updateData = {};
  if (name) updateData.name = name;
  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already exists');
    }
    updateData.email = email;
  }
  if (password) {
    updateData.password = await hashPassword(password);
  }
  if (role) updateData.role = role;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

export const deleteUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isArchived: true },
    select: { id: true, name: true, email: true },
  });

  return user;
};
