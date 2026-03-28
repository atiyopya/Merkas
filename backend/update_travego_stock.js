const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Travego stok miktarları güncelleniyor (Hedef: 6 Adet)...');

  const oemCodes = [
    'A4570305017', 'A4570161520', 'A4570300040', 'A4570300160', '0433271466', 'A4571800101',
    'A4572002101', 'A4570962299', 'A0001802909', 'A0004771302', 'A0040941704', 'A0029933596',
    'A4700300817', 'A4700160220', 'A4700700587', 'A4700961199', 'A4702000801', 'A4701800165',
    'A4701800009', 'A4710901752', 'A0001421089', 'A0040943504', 'A0072528114', 'A0012503203',
    'A0022506415', 'A0002540047', 'A0012954106', 'A9452626002', 'A9452622723', 'A9472691010',
    'A0239971647', 'A0002604998', 'A0004295697', 'A4711306015', 'A0025453914', 'A0034316806'
  ];

  const result = await prisma.product.updateMany({
    where: {
      code: { in: oemCodes }
    },
    data: {
      stock: 6
    }
  });

  console.log(`\n✅ Toplam ${result.count} adet ürünün stoku 6 olarak güncellendi!`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
