const prisma = require('./src/prismaClient');
async function run() {
  const travego = await prisma.carModel.findUnique({
    where: { name: 'TRAVEGO' },
    include: { products: true }
  });
  console.log('TRAVEGO Model:', JSON.stringify(travego, null, 2));
  
  const sampleProduct = await prisma.product.findFirst({
    where: { code: 'A4570305017' },
    include: { compatibleModels: true }
  });
  console.log('Sample Product:', JSON.stringify(sampleProduct, null, 2));
}
run().finally(() => prisma.$disconnect());
