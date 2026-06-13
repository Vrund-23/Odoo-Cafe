import prisma from '../config/database.js';

export const createFloor = async (name) => {
  const existingFloor = await prisma.floor.findUnique({
    where: { name },
  });

  if (existingFloor) {
    throw new Error('Floor already exists');
  }

  const floor = await prisma.floor.create({
    data: { name },
    include: {
      tables: {
        select: { id: true, tableNumber: true, seats: true },
      },
    },
  });

  return floor;
};

export const getAllFloors = async () => {
  return await prisma.floor.findMany({
    include: {
      tables: {
        select: { id: true, tableNumber: true, seats: true, isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getFloorById = async (id) => {
  const floor = await prisma.floor.findUnique({
    where: { id },
    include: {
      tables: {
        select: { id: true, tableNumber: true, seats: true, isActive: true },
      },
    },
  });

  if (!floor) {
    throw new Error('Floor not found');
  }

  return floor;
};

export const updateFloor = async (id, name) => {
  const floor = await prisma.floor.update({
    where: { id },
    data: { name },
    include: {
      tables: {
        select: { id: true, tableNumber: true, seats: true },
      },
    },
  });

  return floor;
};

export const deleteFloor = async (id) => {
  await prisma.floor.delete({
    where: { id },
  });

  return { success: true };
};
