import { PrismaClient, PageKey } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const opsPasswordHash = await bcrypt.hash('user123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'System Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      isProtected: true,
      permissions: Object.values(PageKey),
    },
  });
  console.log(`Upserted admin user: ${admin.username}`);

  const ops = await prisma.user.upsert({
    where: { username: 'ops.tariq' },
    update: {},
    create: {
      name: 'Tariq Mehmood',
      username: 'ops.tariq',
      passwordHash: opsPasswordHash,
      isProtected: false,
      permissions: [PageKey.dashboard, PageKey.shipments, PageKey.weightproforma],
    },
  });
  console.log(`Upserted ops user: ${ops.username}`);

  // Create some initial carton types if they don't exist
  const smallBox = await prisma.cartonType.upsert({
    where: { name: 'Small Box (10x10x10)' },
    update: {},
    create: {
      name: 'Small Box (10x10x10)',
      lengthCm: 10,
      widthCm: 10,
      heightCm: 10,
      lowStockThreshold: 50,
    }
  });

  const mediumBox = await prisma.cartonType.upsert({
    where: { name: 'Medium Box (20x20x20)' },
    update: {},
    create: {
      name: 'Medium Box (20x20x20)',
      lengthCm: 20,
      widthCm: 20,
      heightCm: 20,
      lowStockThreshold: 20,
    }
  });
  console.log(`Upserted carton types: ${smallBox.name}, ${mediumBox.name}`);

  // Expense Categories
  const categories = ['Fuel & Transport', 'Office Supplies', 'Utilities', 'Maintenance', 'Meals & Entertainment'];
  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat, isActive: true },
    });
  }
  console.log(`Upserted expense categories.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
