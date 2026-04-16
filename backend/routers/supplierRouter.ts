import { Router } from 'express';
import { SupplierRepository } from '../repositories/supplierRepository.js';

const router = Router();
const supplierRepo = new SupplierRepository();

router.get('/', async (req, res) => {
  try {
    const suppliers = await supplierRepo.getAll();
    res.json(suppliers);
  } catch (err) {
    console.error('Supplier Get All Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = await supplierRepo.create(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    console.error('Supplier Post Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await supplierRepo.update(parseInt(req.params.id), req.body);
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await supplierRepo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
