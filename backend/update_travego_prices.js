const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Travego parça fiyatları güncelleniyor (%10 maliyet payı ile)...');

  const priceList = [
    // EURO 5
    { code: 'A4570305017', sellPrice: 42500 },
    { code: 'A4570161520', sellPrice: 8200 },
    { code: 'A4570300040', sellPrice: 5400 },
    { code: 'A4570300160', sellPrice: 4800 },
    { code: '0433271466', sellPrice: 3100 },
    { code: 'A4572002101', sellPrice: 12600 },
    { code: 'A4570962299', sellPrice: 48000 },
    { code: 'A0001802909', sellPrice: 950 },
    
    // EURO 6
    { code: 'A4700300817', sellPrice: 56000 },
    { code: 'A4700160220', sellPrice: 11500 },
    { code: 'A4700700587', sellPrice: 18500 },
    { code: 'A4700961199', sellPrice: 62000 },
    { code: 'A4702000801', sellPrice: 19200 },
    { code: 'A0001421089', sellPrice: 1850 },

    // ŞANZIMAN VE DEBRİYAJ
    { code: 'A0072528114', sellPrice: 18500 },
    { code: 'A0012503203', sellPrice: 14200 },
    { code: 'A0022506415', sellPrice: 7400 },
    { code: 'A0002540047', sellPrice: 9800 },
    { code: 'A0012954106', sellPrice: 5600 },
    { code: 'A9452622723', sellPrice: 3900 },
    { code: 'A9472691010', sellPrice: 11200 },

    // FREN VE HAVA SİSTEMİ
    { code: 'A0004295697', sellPrice: 2100 },
    { code: 'A4711306015', sellPrice: 28500 },
    { code: 'A0034316806', sellPrice: 13400 }
  ];

  let updatedCount = 0;

  for (const item of priceList) {
    const buyPrice = item.sellPrice * 0.90; // %10 daha düşük
    
    try {
      await prisma.product.update({
        where: { code: item.code },
        data: {
          buyPrice: buyPrice,
          sellPrice: item.sellPrice
        }
      });
      updatedCount++;
    } catch (e) {
      console.warn(`Hata: ${item.code} kodlu ürün bulunamadı, atlanıyor.`);
    }
  }

  console.log(`\n✅ Toplam ${updatedCount} adet ürünün alış/satış fiyatları güncellendi!`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
