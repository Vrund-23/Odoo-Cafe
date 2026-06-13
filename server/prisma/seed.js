import prisma from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.util.js';

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@odoocafe.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@odoocafe.com',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', adminUser);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: {
        name: 'Beverages',
        color: '#FF6B6B',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Food' },
      update: {},
      create: {
        name: 'Food',
        color: '#4ECDC4',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Desserts' },
      update: {},
      create: {
        name: 'Desserts',
        color: '#FFE66D',
      },
    }),
  ]);

  console.log('Categories created:', categories);

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Coffee',
        categoryId: categories[0].id,
        price: 120,
        tax: 5,
        showInKds: false,
        description: 'Hot coffee',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Tea',
        categoryId: categories[0].id,
        price: 80,
        tax: 5,
        showInKds: false,
        description: 'Hot tea',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Burger',
        categoryId: categories[1].id,
        price: 250,
        tax: 5,
        showInKds: true,
        description: 'Delicious burger',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pizza',
        categoryId: categories[1].id,
        price: 350,
        tax: 5,
        showInKds: true,
        description: 'Fresh pizza',
      },
    }),
  ]);

  console.log('Products created:', products);

  // Create sample floor
  const floor = await prisma.floor.create({
    data: {
      name: 'Ground Floor',
    },
  });

  console.log('Floor created:', floor);

  // Create sample tables
  await Promise.all([
    prisma.table.create({
      data: {
        floorId: floor.id,
        tableNumber: 'T01',
        seats: 4,
      },
    }),
    prisma.table.create({
      data: {
        floorId: floor.id,
        tableNumber: 'T02',
        seats: 4,
      },
    }),
    prisma.table.create({
      data: {
        floorId: floor.id,
        tableNumber: 'T03',
        seats: 6,
      },
    }),
  ]);

  console.log('Tables created');

  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
