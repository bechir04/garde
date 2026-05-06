import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Truncate users and cascade to all dependent tables
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE users CASCADE`);
  console.log('All users deleted (cascade).');

  // Create admin user
  const passwordHash = await bcrypt.hash('mohamed123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'mohamed',
      passwordHash,
      fullName: 'mohamed',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
