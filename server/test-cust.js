import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const order = await prisma.order.findUnique({
    where: { orderNumber: 'ORD-140620260012' },
    include: { customer: true }
  });
  console.log("Customer for ORD-140620260012:", order?.customer?.name);
}

test().finally(() => prisma.$disconnect());
