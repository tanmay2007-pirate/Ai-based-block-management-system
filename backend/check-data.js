const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const assets = await prisma.asset.count();
  const tasks = await prisma.maintenanceTask.count();
  const tracks = await prisma.trackMaintenance.count();
  const trains = await prisma.trainOperations.count();
  const blockPlans = await prisma.blockPlan.count();
  console.log('Assets:', assets);
  console.log('Maintenance Tasks:', tasks);
  console.log('Track Maintenance:', tracks);
  console.log('Train Operations:', trains);
  console.log('Block Plans:', blockPlans);
  await prisma.$disconnect();
}
check().catch(console.error);