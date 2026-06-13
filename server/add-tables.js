import prisma from './src/config/database.js';

async function addTables() {
  let floor = await prisma.floor.findFirst({
    where: { name: 'Ground Floor' }
  });

  if (!floor) {
    floor = await prisma.floor.create({
      data: { name: 'Ground Floor' }
    });
  }

  // Upsert tables T01 through T10
  for (let i = 1; i <= 10; i++) {
    const tableNumber = `T${i < 10 ? '0' + i : i}`;
    await prisma.table.upsert({
      where: {
        floorId_tableNumber: {
          floorId: floor.id,
          tableNumber,
        }
      },
      update: {
        isActive: true,
      },
      create: {
        floorId: floor.id,
        tableNumber,
        seats: i % 2 === 0 ? 4 : 2,
        isActive: true,
      }
    });
  }

  console.log('✅ Upserted 10 tables (T01 - T10) successfully on Ground Floor!');
  await prisma.$disconnect();
}

addTables().catch(console.error);
