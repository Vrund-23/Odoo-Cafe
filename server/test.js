import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.paymentMethod.findMany().then(async methods => {
  for (const m of methods) {
    if (m.name === 'Payment Method') {
      await prisma.paymentMethod.update({where:{id:m.id}, data:{name: m.type}});
    }
  }
  console.log('Done');
  prisma.$disconnect();
});
