const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Sarf malzemesi ve yardımcı ürün stokları yükleniyor...');

  const consumables = [
    { name: 'BALATA SPREYİ (500ML)', brand: 'GENEL', sellPrice: 120, code: 'SARF-BALATA-500' },
    { name: 'WD-40 PAS SÖKÜCÜ (400ML)', brand: 'WD-40', sellPrice: 240, code: 'SARF-WD40-400' },
    { name: 'İRAN YAPIŞTIRICI (EPOXY ÇİFTLİ)', brand: 'GENEL', sellPrice: 85, code: 'SARF-IRAN-YAPI' },
    { name: 'GRES YAĞI (LİTYUM - 15KG)', brand: 'GENEL', sellPrice: 1850, code: 'SARF-GRES-15KG' },
    { name: 'GAZ YAĞI (5L)', brand: 'GENEL', sellPrice: 450, code: 'SARF-GAZ-YAĞI-5L' },
    { name: 'TEMİZLİK BEZİ (PENYE PAKET)', brand: 'GENEL', sellPrice: 150, code: 'SARF-BEZ-PAKET' },
    { name: 'ANTİFRİZ (KIRMIZI - 3L)', brand: 'GENEL', sellPrice: 420, code: 'SARF-ANTIFRIZ-3L' },
    { name: 'CAM SUYU (ANTİFRİZLİ - 5L)', brand: 'GENEL', sellPrice: 140, code: 'SARF-CAMSUYU-5L' }
  ];

  const allModels = await prisma.carModel.findMany();

  for (const item of consumables) {
    const buyPrice = item.sellPrice * 0.90;
    
    try {
      await prisma.product.upsert({
        where: { code: item.code },
        update: {
          buyPrice: buyPrice,
          sellPrice: item.sellPrice,
          stock: 24
        },
        create: {
          name: item.name.toLocaleUpperCase('tr-TR'),
          brand: item.brand,
          code: item.code,
          stock: 24,
          buyPrice: buyPrice,
          sellPrice: item.sellPrice,
          compatibleModels: {
            connect: allModels.map(m => ({ id: m.id }))
          }
        }
      });
      console.log(`- Ürün eklendi: ${item.name}`);
    } catch (e) {
      console.error(`Hata (${item.code}):`, e.message);
    }
  }

  console.log('\n✅ Sarf malzemeleri başarıyla sisteme yüklendi!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
