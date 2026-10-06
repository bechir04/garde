import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create the admin user only if it doesn't exist yet. Existing data is
  // never touched, so this is safe to run against the production database.
  const existing = await prisma.user.findUnique({ where: { username: 'mohamed' } });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

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

  console.log('Admin user created:', admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
