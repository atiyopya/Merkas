const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ results: [] });

  try {
    const query = q.toLowerCase();

    // Müşterileri Ara (İsim veya telefon)
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      take: 5
    });

    // Araç Plakalarını Ara
    const vehicles = await prisma.vehicle.findMany({
      where: {
        plate: { contains: query }
      },
      include: { customer: true },
      take: 5
    });

    // Ürünleri Ara
    const products = await prisma.product.findMany({
      where: {
        name: { contains: query }
      },
      take: 5
    });

    // Sonuçları formatla
    const results = [
      ...customers.map(c => ({
        id: c.id,
        title: c.name,
        subtitle: `Müşteri - ${c.phone || 'Telefon Yok'}`,
        type: 'CUSTOMER',
        link: `/customers` // Front-end'de ilgili carinin ekstresine gidecek
      })),
      ...vehicles.map(v => ({
        id: v.customerId,
        title: v.plate,
        subtitle: `Araç - ${v.customer.name} (${v.model || 'Model Yok'})`,
        type: 'VEHICLE',
        link: `/customers`
      })),
      ...products.map(p => ({
        id: p.id,
        title: p.name,
        subtitle: `Ürün - Stok: ${p.stock} - Fiyat: ${p.salePrice}₺`,
        type: 'PRODUCT',
        link: `/inventory`
      }))
    ];

    res.json({ results });
  } catch (error) {
    console.error('Arama hatası:', error);
    res.status(500).json({ error: 'Arama sırasında bir hata oluştu' });
  }
});

module.exports = router;
