import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const seqMap = {};

    console.log(`Found ${orders.length} orders to update.`);

    for (const order of orders) {
      const d = new Date(order.createdAt);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateStr = `${day}${month}${year}`;

      if (!seqMap[dateStr]) {
        seqMap[dateStr] = 1;
      }
      
      const sequence = String(seqMap[dateStr]).padStart(4, '0');
      const newOrderNumber = `ORD-${dateStr}${sequence}`;
      
      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber: newOrderNumber }
      });

      console.log(`Updated Order ${order.id} -> ${newOrderNumber}`);
      seqMap[dateStr]++;
    }

    console.log('Successfully updated all order IDs!');
  } catch (error) {
    console.error('Failed to update orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
