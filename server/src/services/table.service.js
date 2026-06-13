import prisma from '../config/database.js';

export const createTable = async (data) => {
  const { floorId, tableNumber, seats } = data;

  const floor = await prisma.floor.findUnique({
    where: { id: floorId },
  });

  if (!floor) {
    throw new Error('Floor not found');
  }

  const table = await prisma.table.create({
    data: {
      floorId,
      tableNumber,
      seats,
      isActive: true,
    },
    include: {
      floor: {
        select: { id: true, name: true },
      },
    },
  });

  return table;
};

export const getAllTables = async () => {
  return await prisma.table.findMany({
    include: {
      floor: {
        select: { id: true, name: true },
      },
    },
    orderBy: { tableNumber: 'asc' },
  });
};

export const getTablesByFloor = async (floorId) => {
  return await prisma.table.findMany({
    where: { floorId },
    include: {
      floor: {
        select: { id: true, name: true },
      },
    },
    orderBy: { tableNumber: 'asc' },
  });
};

export const updateTable = async (id, data) => {
  const table = await prisma.table.update({
    where: { id },
    data,
    include: {
      floor: {
        select: { id: true, name: true },
      },
    },
  });

  return table;
};

export const deleteTable = async (id) => {
  await prisma.table.delete({
    where: { id },
  });

  return { success: true };
};
