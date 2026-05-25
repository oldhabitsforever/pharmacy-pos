import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: adminHash, fullName: 'Admin User', role: 'admin' },
  });
  await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: {},
    create: { username: 'cashier1', passwordHash: cashierHash, fullName: 'Cashier One', role: 'cashier' },
  });

  const types = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Sachet'];
  for (const name of types) {
    await prisma.productType.upsert({ where: { name }, update: {}, create: { name } });
  }

  const settings = [
    { key: 'pharmacy_name', value: 'Al-Shifa Pharmacy' },
    { key: 'pharmacy_address', value: '123 Main Street, Karachi' },
    { key: 'pharmacy_phone', value: '+92-21-1234567' },
    { key: 'low_stock_threshold', value: '10' },
    { key: 'expiry_alert_days', value: '90' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  console.log('Seed completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
