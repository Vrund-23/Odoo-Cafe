import { PrismaClient } from '@prisma/client';
import { createOrder } from './src/services/order.service.js';

const prisma = new PrismaClient();

async function test() {
  try {
    const session = await prisma.session.findFirst({ where: { status: 'OPEN' } });
    const product = await prisma.product.findFirst();
    const customer = await prisma.customer.findFirst();

    const data = {
      sessionId: session.id,
      tableId: null,
      customerId: customer.id,
      employeeId: "ghost-id-1234",
      items: [
        { productId: product.id, quantity: 1, unitPrice: Number(product.price) }
      ]
    };

    console.log("Simulating createOrder with data:", JSON.stringify(data));
    const result = await createOrder(data);
    console.log("Success! Order ID:", result.id);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
