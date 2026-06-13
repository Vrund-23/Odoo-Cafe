import prisma from './src/config/database.js';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isArchived: true, password: true }
  });
  users.forEach(u => {
    console.log(`${u.email} | role: ${u.role} | archived: ${u.isArchived} | pwd_len: ${u.password?.length}`);
  });
  await prisma.$disconnect();
}

main().catch(console.error);
