const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Lubex yağ stokları yükleniyor (20L birimiyle)...');

  const oils = [
    { name: 'Lubex Robus Global LA 5W-30 (20L)', type: 'Tam Sentetik (Euro 6)', sellPrice: 4850, code: 'LUBEX-5W30-GLA-20L' },
    { name: 'Lubex Robus Global LA 10W-40 (20L)', type: 'Tam Sentetik (Euro 6)', sellPrice: 4400, code: 'LUBEX-10W40-GLA-20L' },
    { name: 'Lubex Robus Master 5W-30 (20L)', type: 'Tam Sentetik', sellPrice: 4600, code: 'LUBEX-5W30-MST-20L' },
    { name: 'Lubex Robus Master Plus 10W-40 (20L)', type: 'Tam Sentetik', sellPrice: 4150, code: 'LUBEX-10W40-MSP-20L' },
    { name: 'Lubex Robus Master 10W-40 (20L)', type: 'Sentetik', sellPrice: 3850, code: 'LUBEX-10W40-MST-20L' },
    { name: 'Lubex Robus Pro LA 10W-30 (20L)', type: 'Sentetik', sellPrice: 3600, code: 'LUBEX-10W30-PRO-20L' },
    { name: 'Lubex Robus Pro LA 10W-40 (20L)', type: 'Sentetik', sellPrice: 3750, code: 'LUBEX-10W40-PLA-20L' },
    { name: 'Lubex Robus Pro LA 15W-40 (20L)', type: 'Mineral', sellPrice: 3200, code: 'LUBEX-15W40-PLA-20L' },
    { name: 'Lubex Robus Pro 10W-40 (20L)', type: 'Sentetik', sellPrice: 3450, code: 'LUBEX-10W40-PRO-20L' },
    { name: 'Lubex Robus Pro 15W-40 (20L)', type: 'Mineral', sellPrice: 3100, code: 'LUBEX-15W40-PRO-20L' },
    { name: 'Lubex Robus Turbo 15W-40 (20L)', type: 'Mineral (Euro 5/4)', sellPrice: 2950, code: 'LUBEX-15W40-TRB-20L' },
    { name: 'Lubex Robus Turbo 20W-50 (20L)', type: 'Mineral', sellPrice: 2800, code: 'LUBEX-20W50-TRB-20L' },
    { name: 'Lubex Robus KM 20W-50 (20L)', type: 'Mineral (Yüksek KM)', sellPrice: 2900, code: 'LUBEX-20W50-KM-20L' },
    { name: 'Lubex Mono M1 / M2 / M3 / M4 (20L)', type: 'Tek Dereceli', sellPrice: 2400, code: 'LUBEX-MONO-M-20L' }
  ];

  // Yağların tüm modellere (TRAVEGO, TOURISMO vb.) uyumlu olması için tüm modelleri alıyoruz
  const allModels = await prisma.carModel.findMany();

  for (const oil of oils) {
    const buyPrice = oil.sellPrice * 0.90;
    
    try {
      await prisma.product.upsert({
        where: { code: oil.code },
        update: {
          buyPrice: buyPrice,
          sellPrice: oil.sellPrice,
          stock: 6
        },
        create: {
          name: oil.name.toLocaleUpperCase('tr-TR'),
          brand: 'LUBEX',
          code: oil.code,
          stock: 6,
          buyPrice: buyPrice,
          sellPrice: oil.sellPrice,
          compatibleModels: {
            connect: allModels.map(m => ({ id: m.id }))
          }
        }
      });
      console.log(`- Yağ eklendi/güncellendi: ${oil.name}`);
    } catch (e) {
      console.error(`Hata (${oil.code}):`, e.message);
    }
  }

  console.log('\n✅ Lubex yağ stokları ve fiyatları başarıyla sisteme yüklendi!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
