import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst();
    const session = await prisma.session.findFirst({ where: { status: 'OPEN' } });
    const product = await prisma.product.findFirst();
    const customer = await prisma.customer.findFirst();
    const table = await prisma.table.findFirst();

    console.log('Testing create order with:', {
      employeeId: user?.id,
      sessionId: session?.id,
      productId: product?.id
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: 'TEST-' + Date.now(),
        sessionId: session.id,
        tableId: table.id,
        customerId: customer.id,
        employeeId: user.id,
        status: 'DRAFT',
        subtotal: 100,
        taxAmount: 10,
        discountAmount: 0,
        total: 110,
        orderItems: {
          createMany: {
            data: [
              {
                productId: product.id,
                quantity: 1,
                unitPrice: 100,
                lineTotal: 100,
                discountAmount: 0
              }
            ]
          }
        }
      }
    });
    console.log('Successfully created order:', order.id);

  } catch (error) {
    console.error('Failed to create order:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
