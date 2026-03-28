const prisma = require('./src/prismaClient');
async function run() {
  const models = await prisma.carModel.findMany();
  console.log(JSON.stringify(models, null, 2));
}
run().finally(() => prisma.$disconnect());
