const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Lubex Mitras (Şanzıman/Diferansiyel) stokları yükleniyor...');

  const mitrasOils = [
    { name: 'Lubex Mitras MT EP SYN 75W-80 (20L)', type: 'Sentetik (Şanzıman)', sellPrice: 4950, code: 'LUBEX-75W80-MSYN-20L' },
    { name: 'Lubex Mitras AX SYN Ultra 75W-90 (20L)', type: 'Sentetik (Diferansiyel)', sellPrice: 5200, code: 'LUBEX-75W90-ASYN-20L' },
    { name: 'Lubex Mitras AX SYN 75W-140 (20L)', type: 'Sentetik (Ağır Hizmet)', sellPrice: 5800, code: 'LUBEX-75W140-ASYN-20L' },
    { name: 'Lubex Mitras AX HYP 80W-90 (20L)', type: 'Hipoid Dişli Yağı', sellPrice: 3400, code: 'LUBEX-80W90-AXH-20L' },
    { name: 'Lubex Mitras AX HYP 85W-140 (20L)', type: 'Hipoid Dişli Yağı', sellPrice: 3650, code: 'LUBEX-85W140-AXH-20L' },
    { name: 'Lubex Mitras MT EP 80W-90 (20L)', type: 'Şanzıman Yağı', sellPrice: 3250, code: 'LUBEX-80W90-MTE-20L' },
    { name: 'Lubex Mitras AX EP PLUS 80W-90 (20L)', type: 'EP Katkılı', sellPrice: 3550, code: 'LUBEX-80W90-AXEP-20L' },
    { name: 'Lubex Mitras AX LS 85W-140 (20L)', type: 'Kilitli Diferansiyel', sellPrice: 3900, code: 'LUBEX-85W140-AXLS-20L' },
    { name: 'Lubex Mitras ATF HD III (20L)', type: 'Oto. Şanzıman', sellPrice: 4100, code: 'LUBEX-ATF-HD3-20L' },
    { name: 'Lubex Mitras ATF DX III (20L)', type: 'Oto. Şanzıman/Direksiyon', sellPrice: 3600, code: 'LUBEX-ATF-DX3-20L' },
    { name: 'Lubex Mitras ATF DX II (20L)', type: 'Oto. Şanzıman/Direksiyon', sellPrice: 3200, code: 'LUBEX-ATF-DX2-20L' },
    { name: 'Lubex Mitras TO 30 / TO 50 (20L)', type: 'İş Makinesi/Transmisyon', sellPrice: 3100, code: 'LUBEX-MITRAS-TO-20L' },
    { name: 'Lubex Mitras MT 90 / MT 140 (20L)', type: 'Düz Dişli Yağları', sellPrice: 2850, code: 'LUBEX-MITRAS-MT-20L' }
  ];

  const allModels = await prisma.carModel.findMany();

  for (const oil of mitrasOils) {
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
      console.log(`- Mitras Yağ eklendi/güncellendi: ${oil.name}`);
    } catch (e) {
      console.error(`Hata (${oil.code}):`, e.message);
    }
  }

  console.log('\n✅ Lubex Mitras serisi başarıyla sisteme yüklendi!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
