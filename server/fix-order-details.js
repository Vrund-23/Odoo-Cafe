import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.table.findMany();
    const customers = await prisma.customer.findMany();

    if (tables.length === 0 || customers.length === 0) {
      console.log('No tables or customers found to assign.');
      return;
    }

    const ordersToUpdate = await prisma.order.findMany({
      where: {
        OR: [
          { tableId: null },
          { customerId: null }
        ]
      }
    });

    console.log(`Found ${ordersToUpdate.length} orders missing table or customer details.`);

    for (const order of ordersToUpdate) {
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];

      await prisma.order.update({
        where: { id: order.id },
        data: {
          tableId: order.tableId || randomTable.id,
          customerId: order.customerId || randomCustomer.id
        }
      });
      console.log(`Updated Order ${order.orderNumber} with Table ${randomTable.tableNumber} and Customer ${randomCustomer.name}`);
    }

    console.log('Successfully assigned tables and customers to all orders!');
  } catch (error) {
    console.error('Failed to update orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
