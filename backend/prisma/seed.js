const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

const DEMO_PASSWORD = 'Demo@1234';
const accounts = [
  { name: 'Engineering Demo', email: 'engineer@demo.com', role: 'engineering', department: 'TMS' },
  { name: 'Traction Demo', email: 'traction@demo.com', role: 'traction', department: 'TDMS' },
  { name: 'Signal Demo', email: 'signal@demo.com', role: 'signal', department: 'SMMS' },
  { name: 'Control Office Demo', email: 'control@demo.com', role: 'control_office', department: 'COA' },
  { name: 'Administrator Demo', email: 'admin@demo.com', role: 'admin', department: 'ADMIN' },
];

async function main() {
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password_hash,
        role: account.role,
        department: account.department,
      },
      create: { ...account, password_hash },
    });
    console.log(`${account.email} / ${DEMO_PASSWORD} (${account.role}, ${account.department})`);
  }
}

main()
  .catch((error) => {
    console.error('Failed to seed demo users:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
