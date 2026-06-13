import prisma from './src/config/database.js';

async function seedPaymentMethods() {
  const types = ['CASH', 'CARD', 'UPI'];
  for (const type of types) {
    const existing = await prisma.paymentMethod.findFirst({ where: { type } });
    if (!existing) {
      await prisma.paymentMethod.create({ data: { type, isEnabled: true } });
      console.log(`Created payment method: ${type}`);
    } else {
      console.log(`Payment method already exists: ${type}`);
    }
  }
  const all = await prisma.paymentMethod.findMany();
  console.log('All payment methods:', JSON.stringify(all, null, 2));
  await prisma.$disconnect();
}

seedPaymentMethods().catch(console.error);
