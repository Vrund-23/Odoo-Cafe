import prisma from './src/config/database.js';
import * as sessionService from './src/services/session.service.js';

async function test() {
  try {
    const user = await prisma.user.findFirst();
    console.log('Testing session creation for user:', user.id);
    
    const session = await sessionService.createSession(user.id);
    console.log('Created Session:', session);
    
    // Clean up
    await prisma.session.delete({ where: { id: session.id } });
    console.log('Cleaned up session.');
  } catch (err) {
    console.error('Session creation failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
