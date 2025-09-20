import { Router } from 'express';
import BOM from '../models/BOM.js';
import Product from '../models/Product.js';
import Operation from '../models/Operation.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', auth(false), async (req, res, next) => {
  try {
    const { parent, effective_on, date_from, date_to, query } = req.query;
    const filter = { is_deleted: 0 };
    if (parent) filter.parent_product_code = parent;
    if (query) {
      filter.$or = [
        { parent_product_code: new RegExp(query, 'i') },
        { component_product_code: new RegExp(query, 'i') },
      ];
    }
    if (effective_on) {
      // Backward compatibility: effective at a single day
      const date = new Date(effective_on);
      filter.effective_from = { $lte: date };
      filter.$or = [ { effective_to: null }, { effective_to: { $gte: date } } ];
    } else if (date_from || date_to) {
      // Range by effective_from
      filter.effective_from = {};
      if (date_from) filter.effective_from.$gte = new Date(date_from);
      if (date_to) filter.effective_from.$lte = new Date(date_to);
    }
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.page_size ?? '20', 10)));
    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      BOM.countDocuments(filter),
      BOM.find(filter).sort({ parent_product_code: 1, component_product_code: 1 }).skip(skip).limit(pageSize),
    ]);
    res.json({ items, page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) });
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
