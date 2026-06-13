import prisma from '../config/database.js';

export const createSession = async (userId) => {
  const session = await prisma.session.create({
    data: {
      userId,
      status: 'OPEN',
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return session;
};

export const getSessionById = async (id) => {
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true },
      },
      orders: {
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  return session;
};

export const getOpenSessionByUser = async (userId) => {
  const session = await prisma.session.findFirst({
    where: {
      userId,
      status: 'OPEN',
    },
  });

  return session;
};

export const getAllSessions = async (limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const sessions = await prisma.session.findMany({
    skip,
    take: parseInt(limit),
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.session.count();

  return { sessions, total };
};

export const closeSession = async (sessionId, closingAmount) => {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      closingAmount,
    },
    include: {
      orders: {
        where: { status: 'PAID' },
      },
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return session;
};
