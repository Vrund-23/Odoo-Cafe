import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dummyNames = [
    'Alice Smith',
    'Bob Johnson',
    'Charlie Davis',
    'Diana Prince',
    'Evan Wright',
    'Fiona Gallagher',
    'George Martin',
    'Hannah Abbott'
  ];

  try {
    console.log('Creating new dummy customers...');
    for (const name of dummyNames) {
      const email = name.toLowerCase().replace(' ', '.') + '@example.com';
      await prisma.customer.create({
        data: { name, email, phone: '555-' + Math.floor(1000 + Math.random() * 9000) }
      });
    }
    
    const allCustomers = await prisma.customer.findMany();
    const orders = await prisma.order.findMany();
    
    console.log(`Randomly assigning ${allCustomers.length} customers across ${orders.length} orders...`);

    for (const order of orders) {
      const randomCustomer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId: randomCustomer.id }
      });
    }

    console.log('Successfully diversified customer names!');
  } catch (error) {
    console.error('Error updating customers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
