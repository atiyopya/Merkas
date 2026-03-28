const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  try {
    const models = await prisma.carModel.findMany({ orderBy: { name: 'asc' } });
    
    // Her model için Vehicle tablosundaki kayıt sayısını bulalım
    const vehicleCounts = await prisma.vehicle.groupBy({
      by: ['model'],
      _count: {
        _all: true
      }
    });

    const countMap = vehicleCounts.reduce((acc, curr) => {
      if (curr.model) acc[curr.model] = curr._count._all;
      return acc;
    }, {});

    const results = models.map(m => ({
      ...m,
      vehicleCount: countMap[m.name] || 0
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Modeller alınamadı' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const model = await prisma.carModel.create({ 
      data: { name: name.toLocaleUpperCase('tr-TR') } 
    });
    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ error: 'Model eklenirken hata oluştu veya bu model zaten var.' });
  }
});

// Model ismini güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedModel = await prisma.carModel.update({
      where: { id: parseInt(id) },
      data: { name: name.toLocaleUpperCase('tr-TR') }
    });
    res.json(updatedModel);
  } catch (error) {
    res.status(500).json({ error: 'Model güncellenirken hata oluştu.' });
  }
});

// Modele göre uyumlu parçaları getir
router.get('/:id/parts', async (req, res) => {
  try {
    const { id } = req.params;
    const carModel = await prisma.carModel.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });

    if (!carModel) {
      return res.status(404).json({ error: 'Model bulunamadı' });
    }

    res.json(carModel.products);
  } catch (error) {
    res.status(500).json({ error: 'Uyumlu parçalar alınamadı' });
  }
});

module.exports = router;
