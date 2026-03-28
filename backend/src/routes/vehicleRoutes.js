const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Tüm araçları getir
router.get('/', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        customer: { select: { name: true, phone: true } }
      },
      orderBy: { plate: 'asc' }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Araç verileri alınamadı' });
  }
});

// Araca göre uyumlu parçaları getir
router.get('/:id/parts', async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vehicle || !vehicle.model) {
      return res.json([]);
    }

    // Model ismine göre CarModel bulup ürünleri getir
    const carModel = await prisma.carModel.findUnique({
      where: { name: vehicle.model },
      include: {
        products: {
          include: { compatibleModels: true }
        }
      }
    });

    if (!carModel) {
      return res.json([]);
    }

    res.json(carModel.products);
  } catch (error) {
    res.status(500).json({ error: 'Uyumlu parçalar alınamadı' });
  }
});

module.exports = router;
