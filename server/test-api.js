import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function test() {
  const session = await prisma.session.findFirst({ where: { status: 'OPEN' } });
  const product = await prisma.product.findFirst();
  const customer = await prisma.customer.findFirst();
  const user = await prisma.user.findFirst();

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: '1d',
  });

  const data = {
    sessionId: session.id,
    tableId: null,
    customerId: customer.id,
    // NO employeeId AT ALL
    items: [
      { productId: product.id, quantity: 1, unitPrice: Number(product.price) }
    ]
  };

  try {
    const res = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    const text = await res.text();
    console.log("API response status:", res.status);
    console.log("API response body:", text);
  } catch (err) {
    console.error("API error:", err);
  }
}

test().finally(() => prisma.$disconnect());
