const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/', async (req, res) => {
  try {
    const models = await prisma.carModel.findMany({ orderBy: { name: 'asc' } });
    res.json(models);
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
