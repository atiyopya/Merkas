const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Araç modelleri arası parça eşleştirmesi yapılıyor...');

  // Tüm modelleri al
  const allModels = await prisma.carModel.findMany();
  const modelIds = allModels.map(m => ({ id: m.id }));

  // Sadece Mercedes-Benz markalı ürünleri al (Yağlar ve Sarf Malzemeleri zaten eşleşmişti)
  const mbProducts = await prisma.product.findMany({
    where: {
      brand: 'MERCEDES-BENZ'
    }
  });

  console.log(`${mbProducts.length} adet Mercedes-Benz parçası tüm modellere bağlanıyor...`);

  for (const product of mbProducts) {
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          compatibleModels: {
            connect: modelIds
          }
        }
      });
      console.log(`- Bağlandı: ${product.name}`);
    } catch (e) {
      console.error(`Hata (${product.code}):`, e.message);
    }
  }

  console.log('\n✅ Tüm araç modellerinin yedek parça kataloğu başarıyla dolduruldu!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
