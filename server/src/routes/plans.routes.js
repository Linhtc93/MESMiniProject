import { Router } from 'express';
import ProductionPlan from '../models/ProductionPlan.js';
import ProductionOutput from '../models/ProductionOutput.js';
import Product from '../models/Product.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = Router();

async function getProgress(planId) {
  const plan = await ProductionPlan.findById(planId);
  if (!plan) return null;
  const agg = await ProductionOutput.aggregate([
    { $match: { plan_id: plan._id } },
    { $group: { _id: '$plan_id', produced_qty: { $sum: '$quantity' } } }
  ]);
  const produced_qty = agg[0]?.produced_qty || 0;
  const remaining_qty = (plan.plan_qty || 0) - produced_qty;
  return { plan_id: plan._id, plan_qty: plan.plan_qty, produced_qty, remaining_qty: Math.max(0, remaining_qty), started: plan.started, is_completed: plan.is_completed };
}

router.get('/', auth(), async (req, res, next) => {
  try {
    const { date, date_from, date_to, product_code, status } = req.query;
    const filter = { is_deleted: 0 };

    // Backward compatibility: single 'date' exact-day filter
    if (date) {
      const d = new Date(date);
      const dEnd = new Date(d);
      dEnd.setDate(dEnd.getDate() + 1);
      filter.ship_date = { $gte: d, $lt: dEnd };
    } else {
      // New range filter: date_from - date_to (both optional)
      const from = date_from ? new Date(date_from) : null;
      const to = date_to ? new Date(date_to) : null;
      if (from || to) {
        filter.ship_date = {};
        if (from) filter.ship_date.$gte = from;
        if (to) {
          const t = new Date(to);
          t.setDate(t.getDate() + 1); // inclusive of end date
          filter.ship_date.$lt = t;
        }
      }
    }

    if (product_code) filter.product_code = product_code;
    if (status === 'started') filter.started = true;
    if (status === 'not_started') filter.started = false;
    if (status === 'completed') filter.is_completed = true;

    // Pagination defaults
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.page_size ?? '20', 10)));
    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      ProductionPlan.countDocuments(filter),
      ProductionPlan.find(filter)
        .sort({ ship_date: 1, product_code: 1 })
        .skip(skip)
        .limit(pageSize),
    ]);

    res.json({ items, page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) });
  } catch (e) { next(e); }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const plan = await ProductionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Not found' });
    const progress = await getProgress(plan._id);
    res.json({ plan, progress });
  } catch (e) { next(e); }
});

router.get('/:id/progress', auth(), async (req, res, next) => {
  try {
    const progress = await getProgress(req.params.id);
    if (!progress) return res.status(404).json({ message: 'Not found' });
    res.json(progress);
  } catch (e) { next(e); }
});

router.post('/', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    const prod = await Product.findOne({ product_code: data.product_code, is_deleted: 0 });
    if (!prod) return res.status(400).json({ message: 'Mã hàng không tồn tại trong bảng sản phẩm' });
    data.created_by = req.user?.username;
    data.created_at = new Date();
    const created = await ProductionPlan.create(data);
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Kế hoạch cho mã hàng và ngày này đã tồn tại' });
    next(e);
  }
});

router.put('/:id', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.updated_by = req.user?.username;
    data.updated_at = new Date();
    const updated = await ProductionPlan.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const updated = await ProductionPlan.findByIdAndUpdate(
      req.params.id,
      { $set: { is_deleted: 1, deleted_by: req.user?.username, deleted_at: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/:id/start', auth(), requireRoles(['Admin', 'Planner', 'Operator']), async (req, res, next) => {
  try {
    const updated = await ProductionPlan.findByIdAndUpdate(req.params.id, { $set: { started: true, updated_by: req.user?.username, updated_at: new Date() } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/:id/complete', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const updated = await ProductionPlan.findByIdAndUpdate(req.params.id, { $set: { is_completed: true, updated_by: req.user?.username, updated_at: new Date() } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
