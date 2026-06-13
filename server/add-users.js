import prisma from './src/config/database.js';
import bcrypt from 'bcrypt';

async function addUsers() {
  const hash1 = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: { password: hash1 },
    create: { name: 'Admin', email: 'admin@cafe.com', password: hash1, role: 'ADMIN' }
  });

  const hash2 = await bcrypt.hash('eric', 10);
  await prisma.user.upsert({
    where: { email: 'eric@cafe.com' },
    update: { password: hash2 },
    create: { name: 'Eric', email: 'eric@cafe.com', password: hash2, role: 'EMPLOYEE' }
  });

  const hashEmp1 = await bcrypt.hash('123qwe', 10);
  await prisma.user.upsert({
    where: { email: 'emp1@cafe.com' },
    update: { password: hashEmp1 },
    create: { name: 'Employee 1', email: 'emp1@cafe.com', password: hashEmp1, role: 'EMPLOYEE' }
  });

  const hashEmp2 = await bcrypt.hash('123qwe', 10);
  await prisma.user.upsert({
    where: { email: 'emp2@cafe.com' },
    update: { password: hashEmp2 },
    create: { name: 'Employee 2', email: 'emp2@cafe.com', password: hashEmp2, role: 'EMPLOYEE' }
  });

  console.log('✅ Added admin@cafe.com / admin, eric@cafe.com / eric, emp1@cafe.com / 123qwe, emp2@cafe.com / 123qwe');
  await prisma.$disconnect();
}

addUsers().catch(console.error);
