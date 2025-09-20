import { Router } from 'express';
import Product from '../models/Product.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = Router();

// List & search
router.get('/', auth(false), async (req, res, next) => {
  try {
    const { query, category } = req.query;
    const filter = { is_deleted: 0 };
    if (query) {
      filter.$or = [
        { product_code: new RegExp(query, 'i') },
        { product_name: new RegExp(query, 'i') },
        { supplier_code: new RegExp(query, 'i') },
      ];
    }
    if (category) filter.category = category;
    const items = await Product.find(filter).sort({ product_code: 1 }).limit(500);
    res.json(items);
  } catch (e) { next(e); }
});

// Get by code
router.get('/:product_code', auth(false), async (req, res, next) => {
  try {
    const item = await Product.findOne({ product_code: req.params.product_code, is_deleted: 0 });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) { next(e); }
});

// Create
router.post('/', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.created_by = req.user?.username;
    const created = await Product.create(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// Update
router.put('/:product_code', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.updated_by = req.user?.username;
    data.updated_at = new Date();
    const updated = await Product.findOneAndUpdate(
      { product_code: req.params.product_code },
      { $set: data },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

// Soft delete
router.delete('/:product_code', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { product_code: req.params.product_code },
      { $set: { is_deleted: 1, updated_by: req.user?.username, updated_at: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
