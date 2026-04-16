import { Router } from 'express';
import { ProductRepository } from '../repositories/productRepository.js';
import { incrementSerial } from '../use_cases/serialGenerator.js';

const router = Router();
const productRepo = new ProductRepository();

router.get('/', async (req, res) => {
  try {
    const products = await productRepo.getAll();
    res.json(products);
  } catch (err) {
    console.error('Product Get All Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { product_group, serial_no: providedSerial } = req.body;
    let serial_no = providedSerial;

    if (!serial_no) {
      const lastSerial = await productRepo.getLastSerialByGroup(product_group);
      if (lastSerial) {
        serial_no = incrementSerial(lastSerial);
      } else {
        return res.status(400).json({ error: 'Serial number is required for the first product in a group.' });
      }
    }

    const id = await productRepo.create({ ...req.body, serial_no });
    res.status(201).json({ id, ...req.body, serial_no });
  } catch (err) {
    console.error('Product Post Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await productRepo.update(parseInt(req.params.id), req.body);
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await productRepo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
