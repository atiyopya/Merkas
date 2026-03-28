const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/checkout', authMiddleware, async (req, res) => {
  const { customerId, items, paymentMethod, totalAmount, vehicleId } = req.body;
  
  try {
    const result = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.create({
        data: {
          customerId: customerId || null,
          totalAmount: parseFloat(totalAmount),
          items: {
            create: items.map(item => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.totalPrice)
            }))
          },
          vehicleId: vehicleId ? parseInt(vehicleId) : null
        }
      });

      for (const item of items) {
        await prisma.product.update({
          where: { id: parseInt(item.productId) },
          data: { stock: { decrement: parseInt(item.quantity) } }
        });

        await prisma.stockMovement.create({
          data: {
            productId: parseInt(item.productId),
            quantity: -parseInt(item.quantity),
            type: 'SATIŞ',
            description: `Satış işlemi (ID: ${invoice.id})`,
            customerId: customerId ? parseInt(customerId) : null
          }
        });
      }

      const transactionType = paymentMethod === 'VERESIYE' ? 'DEBT' : 'PAYMENT';
      const transaction = await prisma.transaction.create({
        data: {
          customerId: customerId || null,
          invoiceId: invoice.id,
          amount: parseFloat(totalAmount),
          type: transactionType,
          method: paymentMethod,
          vehicleId: vehicleId ? parseInt(vehicleId) : null
        }
      });

      if (paymentMethod === 'VERESIYE' && customerId) {
        await prisma.customer.update({
          where: { id: parseInt(customerId) },
          data: { balance: { increment: parseFloat(totalAmount) } }
        });
      }

      if (req.user && req.user.userId) {
        await prisma.activityLog.create({
          data: {
            action: `Satış yapıldı. Tutar: ${totalAmount} TL. Ödeme Tipi: ${paymentMethod}`,
            userId: parseInt(req.user.userId)
          }
        });
      }

      return { invoice, transaction };
    });
    if (req.io) req.io.emit('dataChanged');
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Satış işlemi sırasında bir hata oluştu' });
  }
});

module.exports = router;
