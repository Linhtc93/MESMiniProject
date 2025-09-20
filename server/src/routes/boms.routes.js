import { Router } from 'express';
import BOM from '../models/BOM.js';
import Product from '../models/Product.js';
import Operation from '../models/Operation.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', auth(false), async (req, res, next) => {
  try {
    const { parent, effective_on } = req.query;
    const filter = { is_deleted: 0 };
    if (parent) filter.parent_product_code = parent;
    if (effective_on) {
      const date = new Date(effective_on);
      filter.effective_from = { $lte: date };
      filter.$or = [ { effective_to: null }, { effective_to: { $gte: date } } ];
    }
    const items = await BOM.find(filter).sort({ parent_product_code: 1 });
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.created_by = req.user?.username;
    // validations
    const parent = await Product.findOne({ product_code: data.parent_product_code, is_deleted: 0 });
    const comp = await Product.findOne({ product_code: data.component_product_code, is_deleted: 0 });
    if (!parent || !comp) return res.status(400).json({ message: 'Mã hàng không tồn tại trong bảng sản phẩm' });
    if (data.operation_code) {
      const op = await Operation.findOne({ operation_code: data.operation_code, is_deleted: 0 });
      if (!op) return res.status(400).json({ message: 'Công đoạn không tồn tại' });
    }
    if (!data.effective_from) data.effective_from = new Date();
    const created = await BOM.create(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.put('/:id', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.updated_by = req.user?.username;
    data.updated_at = new Date();
    if (data.parent_product_code) {
      const parent = await Product.findOne({ product_code: data.parent_product_code, is_deleted: 0 });
      if (!parent) return res.status(400).json({ message: 'Mã hàng cha không tồn tại' });
    }
    if (data.component_product_code) {
      const comp = await Product.findOne({ product_code: data.component_product_code, is_deleted: 0 });
      if (!comp) return res.status(400).json({ message: 'Mã hàng thành phần không tồn tại' });
    }
    if (data.operation_code) {
      const op = await Operation.findOne({ operation_code: data.operation_code, is_deleted: 0 });
      if (!op) return res.status(400).json({ message: 'Công đoạn không tồn tại' });
    }
    const updated = await BOM.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const updated = await BOM.findByIdAndUpdate(
      req.params.id,
      { $set: { is_deleted: 1, updated_by: req.user?.username, updated_at: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
