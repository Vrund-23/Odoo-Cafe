import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const session = await prisma.session.findFirst({ where: { status: 'OPEN' } });
  const orders = await prisma.order.findMany({
    where: { sessionId: session.id },
    take: 1,
    include: { employee: true }
  });
  console.log("Order from DB:", orders[0].employeeId);
  await prisma.$disconnect();
}

test();
