import { Router } from 'express';
import { CustomerRepository } from '../repositories/customerRepository.js';

const router = Router();
const customerRepo = new CustomerRepository();

router.get('/', async (req, res) => {
  try {
    const customers = await customerRepo.getAll();
    res.json(customers);
  } catch (err) {
    console.error('Customers Get All Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = await customerRepo.create(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    console.error('Customers Post Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await customerRepo.update(parseInt(req.params.id), req.body);
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    console.error('Customers Put Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await customerRepo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error('Customers Delete Route Error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
