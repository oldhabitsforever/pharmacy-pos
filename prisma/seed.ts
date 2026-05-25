import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const saltBytes = crypto.randomBytes(16);
  const saltHex = saltBytes.toString('hex');
  const hashBytes = crypto.pbkdf2Sync(password, saltBytes, 100000, 32, 'sha256');
  const hashHex = hashBytes.toString('hex');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function main() {
  const adminHash = hashPassword('admin123');
  const cashierHash = hashPassword('cashier123');

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminHash, isActive: true },
    create: { username: 'admin', passwordHash: adminHash, fullName: 'Admin User', role: 'admin', isActive: true },
  });
  await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: { passwordHash: cashierHash, isActive: true },
    create: { username: 'cashier1', passwordHash: cashierHash, fullName: 'Cashier One', role: 'cashier', isActive: true },
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
