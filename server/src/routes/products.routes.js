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
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.page_size ?? '20', 10)));
    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort({ product_code: 1 }).skip(skip).limit(pageSize),
    ]);
    res.json({ items, page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) });
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
