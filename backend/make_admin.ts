import 'dotenv/config';
import { prisma } from './src/index';

async function main() {
  try {
    const email = 'paramjitbaral@gmail.com';
    const user = await prisma.profile.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log('Successfully updated user to ADMIN:', user.email);
  } catch (error: any) {
    console.error('Error updating user (they might not exist yet!):', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
