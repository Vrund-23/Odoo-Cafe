import { PrismaClient } from '@prisma/client';
import { generateOrderNumber } from './src/utils/order.util.js';

const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany();
    let tables = await prisma.table.findMany();
    let customers = await prisma.customer.findMany();
    const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' } });
    
    // Fallbacks if data is missing
    if (employees.length === 0) {
      console.log('No employees found to assign orders to.');
      return;
    }

    if (customers.length === 0) {
      const c = await prisma.customer.create({ data: { name: 'Dummy Customer', email: 'dummy@cafe.com', phone: '1234567890' } });
      customers.push(c);
    }

    let session = await prisma.session.findFirst({ where: { status: 'OPEN' } });
    if (!session) {
      session = await prisma.session.create({
        data: { userId: employees[0].id, status: 'OPEN' }
      });
    }

    console.log(`Generating 10 dummy orders...`);

    for (let i = 0; i < 10; i++) {
      const table = tables[Math.floor(Math.random() * tables.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const employee = employees[Math.floor(Math.random() * employees.length)];

      const orderNumber = await generateOrderNumber();
      const numItems = Math.floor(Math.random() * 4) + 1; // 1 to 4 items
      const items = [];
      
      let subtotal = 0;
      let taxAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = parseFloat(product.price);
        const lineTotal = unitPrice * quantity;
        const itemTax = (lineTotal * parseFloat(product.tax)) / 100;
        
        subtotal += lineTotal;
        taxAmount += itemTax;

        items.push({
          productId: product.id,
          quantity: quantity,
          unitPrice: unitPrice,
          lineTotal: lineTotal,
          discountAmount: 0
        });
      }

      const total = subtotal + taxAmount;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          sessionId: session.id,
          tableId: table ? table.id : null,
          customerId: customer.id,
          employeeId: employee.id,
          status: Math.random() > 0.5 ? 'PAID' : 'DRAFT',
          subtotal,
          taxAmount,
          discountAmount: 0,
          total,
          orderItems: {
            createMany: {
              data: items
            }
          }
        }
      });

      console.log(`Created order ${order.orderNumber} for ${customer.name} (Total: ₹${total.toFixed(2)})`);
    }

    console.log('Successfully generated 10 dummy orders!');
  } catch (error) {
    console.error('Error seeding dummy orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
