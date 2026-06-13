import prisma from './src/config/database.js';

async function main() {
  const result = await prisma.product.updateMany({ data: { showInKds: true } });
  console.log('Updated', result.count, 'products to showInKds=true');
  const products = await prisma.product.findMany({ select: { name: true, showInKds: true } });
  console.log('Products:', JSON.stringify(products, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
