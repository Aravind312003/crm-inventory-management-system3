import { Router } from 'express';
import { StockRepository } from '../repositories/stockRepository.js';
import { incrementSerial } from '../use_cases/serialGenerator.js';

const router = Router();
const stockRepo = new StockRepository();

router.get('/', async (req, res) => {
  try {
    const stock = await stockRepo.getAll();
    res.json(stock);
  } catch (err) {
    console.error('Stock Get All Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const lastSerial = await stockRepo.getLastSerial();
    const serial_no = incrementSerial(lastSerial);
    
    // Auto calculate total_price and price_per_litre
    const { base_price, has_gst, volume, stock_quantity } = req.body;
    const total_price = has_gst ? base_price * 1.05 : base_price;
    
    // Use volume if available, otherwise use stock_quantity for unit price
    let price_per_litre = 0;
    if (volume > 0) {
      price_per_litre = total_price / volume;
    } else if (stock_quantity > 0) {
      price_per_litre = total_price / stock_quantity;
    }

    const id = await stockRepo.create({ ...req.body, total_price, price_per_litre, serial_no });
    res.status(201).json({ id, ...req.body, total_price, price_per_litre, serial_no });
  } catch (err) {
    console.error('Stock Post Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { base_price, has_gst, volume, stock_quantity } = req.body;
    const total_price = has_gst ? base_price * 1.05 : base_price;
    
    let price_per_litre = 0;
    if (volume > 0) {
      price_per_litre = total_price / volume;
    } else if (stock_quantity > 0) {
      price_per_litre = total_price / stock_quantity;
    }
    
    await stockRepo.update(parseInt(req.params.id), { ...req.body, total_price, price_per_litre });
    res.json({ id: req.params.id, ...req.body, total_price, price_per_litre });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await stockRepo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
