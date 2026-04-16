import { Router } from 'express';
import { SalesRepository } from '../repositories/salesRepository.js';
import { InventoryService } from '../use_cases/inventoryService.js';
import { getSupabase } from '../supabase.js';

const router = Router();
const salesRepo = new SalesRepository();
const inventoryService = new InventoryService();

router.get('/', async (req, res) => {
  try {
    const sales = await salesRepo.getAll();
    res.json(sales);
  } catch (err) {
    console.error('Sales Get All Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('POST /api/sales body:', req.body);
    const { stock_id, ...salesData } = req.body;
    let id;
    if (stock_id) {
      id = await inventoryService.createSaleOrder(salesData, parseInt(stock_id));
    } else {
      id = await salesRepo.create({
        ...salesData,
        amount: salesData.amount || 0,
        quantity: salesData.quantity || 0,
        product_name: salesData.product_name || 'N/A'
      });
    }
    res.status(201).json({ id, ...salesData });
  } catch (err) {
    console.error('Sales Post Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { stock_id, ...salesData } = req.body;
    await inventoryService.updateSaleOrder(parseInt(req.params.id), salesData, stock_id ? parseInt(stock_id) : undefined);
    res.json({ id: req.params.id, ...salesData });
  } catch (err) {
    console.error('Sales Put Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await inventoryService.deleteSaleOrder(parseInt(req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error('Sales Delete Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
