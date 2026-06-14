import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Clearing existing data...');
  
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.kitchenOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Existing data cleared.');
  console.log('Inserting dummy data...');

  // 1. Create Users (2 Admins, 3 Employees)
  const defaultPassword = await hashPassword('password123');
  
  const admins = await Promise.all([
    prisma.user.create({ data: { name: 'Admin One', email: 'admin1@odoocafe.com', password: defaultPassword, role: 'ADMIN' } }),
    prisma.user.create({ data: { name: 'Admin Two', email: 'admin2@odoocafe.com', password: defaultPassword, role: 'ADMIN' } }),
  ]);
  
  const employees = await Promise.all([
    prisma.user.create({ data: { name: 'Employee One', email: 'emp1@odoocafe.com', password: defaultPassword, role: 'EMPLOYEE' } }),
    prisma.user.create({ data: { name: 'Employee Two', email: 'emp2@odoocafe.com', password: defaultPassword, role: 'EMPLOYEE' } }),
    prisma.user.create({ data: { name: 'Employee Three', email: 'emp3@odoocafe.com', password: defaultPassword, role: 'EMPLOYEE' } }),
  ]);

  console.log('Users created: 2 Admins, 3 Employees');

  // 2. Create Floors (2 Floors)
  const floor1 = await prisma.floor.create({ data: { name: 'Ground Floor' } });
  const floor2 = await prisma.floor.create({ data: { name: 'First Floor' } });
  
  console.log('Floors created: Ground Floor, First Floor');

  // 3. Create Tables (10 per floor)
  const createTablesForFloor = async (floorId, prefix) => {
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({
        floorId,
        tableNumber: `${prefix}-${i.toString().padStart(2, '0')}`,
        seats: i % 2 === 0 ? 4 : 2, // mix of 2 and 4 seaters
      });
    }
    await prisma.table.createMany({ data: tables });
  };

  await createTablesForFloor(floor1.id, 'GF');
  await createTablesForFloor(floor2.id, 'FF');
  
  console.log('Tables created: 10 per floor');

  // 4. Create Categories
  const categoriesData = [
    { name: 'Hot Coffees', color: '#6F4E37' },
    { name: 'Cold Coffees', color: '#A67B5B' },
    { name: 'Teas & Infusions', color: '#889e81' },
    { name: 'Pastries & Bakery', color: '#E8A87C' },
    { name: 'Sandwiches & Wraps', color: '#E27D60' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories.push(created);
  }

  console.log('Categories created');

  // 5. Create Products
  const productsData = [
    // Hot Coffees
    { name: 'Espresso', categoryId: categories[0].id, price: 90, tax: 5, showInKds: false, description: 'Strong black coffee' },
    { name: 'Cappuccino', categoryId: categories[0].id, price: 150, tax: 5, showInKds: false, description: 'Espresso with steamed milk and froth' },
    { name: 'Latte', categoryId: categories[0].id, price: 160, tax: 5, showInKds: false, description: 'Espresso with lots of steamed milk' },
    { name: 'Americano', categoryId: categories[0].id, price: 120, tax: 5, showInKds: false, description: 'Espresso with hot water' },
    
    // Cold Coffees
    { name: 'Iced Latte', categoryId: categories[1].id, price: 180, tax: 5, showInKds: false, description: 'Chilled latte over ice' },
    { name: 'Frappuccino', categoryId: categories[1].id, price: 220, tax: 5, showInKds: false, description: 'Blended iced coffee drink' },
    { name: 'Cold Brew', categoryId: categories[1].id, price: 200, tax: 5, showInKds: false, description: 'Slow-steeped cold coffee' },
    
    // Teas & Infusions
    { name: 'Masala Chai', categoryId: categories[2].id, price: 80, tax: 5, showInKds: false, description: 'Traditional Indian spiced tea' },
    { name: 'Green Tea', categoryId: categories[2].id, price: 100, tax: 5, showInKds: false, description: 'Healthy green tea infusion' },
    { name: 'Iced Peach Tea', categoryId: categories[2].id, price: 150, tax: 5, showInKds: false, description: 'Refreshing iced tea with peach flavor' },
    
    // Pastries & Bakery
    { name: 'Butter Croissant', categoryId: categories[3].id, price: 120, tax: 5, showInKds: true, description: 'Flaky and buttery French pastry' },
    { name: 'Chocolate Muffin', categoryId: categories[3].id, price: 100, tax: 5, showInKds: true, description: 'Rich chocolate chip muffin' },
    { name: 'Blueberry Cheesecake', categoryId: categories[3].id, price: 250, tax: 5, showInKds: true, description: 'Slice of creamy blueberry cheesecake' },
    { name: 'Banana Bread', categoryId: categories[3].id, price: 90, tax: 5, showInKds: true, description: 'Moist slice of banana bread' },
    
    // Sandwiches & Wraps
    { name: 'Grilled Cheese Sandwich', categoryId: categories[4].id, price: 180, tax: 5, showInKds: true, description: 'Classic grilled cheese on sourdough' },
    { name: 'Chicken Tikka Wrap', categoryId: categories[4].id, price: 220, tax: 5, showInKds: true, description: 'Spicy chicken tikka in a whole wheat wrap' },
    { name: 'Veggie Club Sandwich', categoryId: categories[4].id, price: 190, tax: 5, showInKds: true, description: 'Triple-decker sandwich with fresh veggies' },
  ];

  await prisma.product.createMany({ data: productsData });

  console.log('Products created');

  // 6. Payment Methods
  await prisma.paymentMethod.createMany({
    data: [
      { name: 'Cash', type: 'CASH', isEnabled: true },
      { name: 'Credit/Debit Card', type: 'CARD', isEnabled: true },
      { name: 'Google Pay / PhonePe', type: 'UPI', isEnabled: true, upiId: 'cafe@upi' },
    ]
  });

  console.log('Payment Methods created');

  console.log('Dummy data seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
