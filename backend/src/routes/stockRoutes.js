const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Tüm stokları getir
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { compatibleModels: true },
      orderBy: { id: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Stok verileri alınamadı' });
  }
});

// Tüm hareketleri getir
router.get('/movements', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = {};

    if (startDate && endDate && startDate !== 'ALL' && endDate !== 'ALL') {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: { 
        product: true,
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(movements);
  } catch (error) {
    console.error('Movements error:', error);
    res.status(500).json({ error: 'Stok hareketleri alınamadı' });
  }
});

// Yeni stok ekle
router.post('/', async (req, res) => {
  try {
    const { name, brand, code, stock, buyPrice, sellPrice, modelIds } = req.body;
    const stockQty = parseInt(stock) || 0;
    
    // modelIds: [1, 2, 3] şeklinde gelmeli
    const modelsToConnect = Array.isArray(modelIds) ? modelIds.map(id => ({ id: parseInt(id) })) : [];

    const product = await prisma.product.create({
      data: { 
        name, 
        brand, 
        code, 
        stock: stockQty, 
        buyPrice: parseFloat(buyPrice) || 0, 
        sellPrice: parseFloat(sellPrice) || 0,
        compatibleModels: {
          connect: modelsToConnect
        }
      },
      include: { compatibleModels: true }
    });

    // İlk hareket kaydı
    if (stockQty > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: stockQty,
          type: 'BAŞLANGIÇ',
          description: 'Ürün sisteme ilk ekleme'
        }
      });
    }

    if (req.io) req.io.emit('dataChanged');
    res.status(201).json(product);
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ error: 'Stok eklenirken bir hata oluştu.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, code, stock, buyPrice, sellPrice, modelIds } = req.body;
    const newStock = parseInt(stock) || 0;
    const modelsToSet = Array.isArray(modelIds) ? modelIds.map(id => ({ id: parseInt(id) })) : [];

    // Eski stok bilgisini al
    const oldProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        brand, 
        code, 
        stock: newStock, 
        buyPrice: parseFloat(buyPrice) || 0, 
        sellPrice: parseFloat(sellPrice) || 0,
        compatibleModels: {
          set: modelsToSet
        }
      },
      include: { compatibleModels: true }
    });

    // Stok değiştiyse hareket kaydet
    const diff = newStock - oldProduct.stock;
    if (diff !== 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: diff,
          type: 'GÜNCELLEME',
          description: diff > 0 ? 'Manuel stok artışı' : 'Manuel stok azaltma'
        }
      });
    }

    if (req.io) req.io.emit('dataChanged');
    res.json(product);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Ürün güncellenirken hata oluştu' });
  }
});

module.exports = router;
