import { Router } from 'express';
import ProductionOutput from '../models/ProductionOutput.js';
import ProductionPlan from '../models/ProductionPlan.js';
import Product from '../models/Product.js';
import Operation from '../models/Operation.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = Router();

async function recomputeCompletion(planId) {
  const plan = await ProductionPlan.findById(planId);
  if (!plan) return null;
  const agg = await ProductionOutput.aggregate([
    { $match: { plan_id: plan._id } },
    { $group: { _id: '$plan_id', produced_qty: { $sum: '$quantity' } } }
  ]);
  const produced_qty = agg[0]?.produced_qty || 0;
  const is_completed = produced_qty >= plan.plan_qty;
  if (plan.is_completed !== is_completed) {
    await ProductionPlan.findByIdAndUpdate(plan._id, { $set: { is_completed } });
  }
  return { produced_qty, is_completed };
}

router.get('/', auth(), async (req, res, next) => {
  try {
    const { plan_id, date_from, date_to } = req.query;
    const filter = {};
    if (plan_id) filter.plan_id = plan_id;
    if (date_from || date_to) {
      filter.production_date = {};
      if (date_from) filter.production_date.$gte = new Date(date_from);
      if (date_to) filter.production_date.$lte = new Date(date_to);
    }
    const items = await ProductionOutput.find(filter).sort({ production_date: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/', auth(), requireRoles(['Admin', 'Operator', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body; // plan_id, product_code, quantity, production_date, operation_code?
    const plan = await ProductionPlan.findById(data.plan_id);
    if (!plan || plan.is_deleted === 1) return res.status(400).json({ message: 'Kế hoạch không tồn tại' });
    if (plan.is_completed) return res.status(400).json({ message: 'Kế hoạch đã hoàn thành' });

    const prod = await Product.findOne({ product_code: data.product_code, is_deleted: 0 });
    if (!prod) return res.status(400).json({ message: 'Mã hàng không tồn tại' });

    if (data.operation_code) {
      const op = await Operation.findOne({ operation_code: data.operation_code, is_deleted: 0 });
      if (!op) return res.status(400).json({ message: 'Công đoạn không tồn tại' });
    }

    data.created_by = req.user?.username;
    if (!data.production_date) data.production_date = new Date();

    // Optional: prevent over-production
    const agg = await ProductionOutput.aggregate([
      { $match: { plan_id: plan._id } },
      { $group: { _id: '$plan_id', produced_qty: { $sum: '$quantity' } } }
    ]);
    const produced_qty = agg[0]?.produced_qty || 0;
    if (produced_qty + data.quantity > plan.plan_qty) {
      // Allow but warn: you can change policy to reject
      // return res.status(400).json({ message: 'Số lượng vượt quá kế hoạch' });
    }

    const created = await ProductionOutput.create(data);
    const status = await recomputeCompletion(plan._id);
    res.status(201).json({ created, progress: { plan_qty: plan.plan_qty, produced_qty: status.produced_qty, is_completed: status.is_completed, remaining_qty: Math.max(0, plan.plan_qty - status.produced_qty) } });
  } catch (e) { next(e); }
});

router.put('/:id', auth(), requireRoles(['Admin', 'Operator', 'Planner']), async (req, res, next) => {
  try {
    const updated = await ProductionOutput.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    await recomputeCompletion(updated.plan_id);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(), requireRoles(['Admin', 'Operator', 'Planner']), async (req, res, next) => {
  try {
    const deleted = await ProductionOutput.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    await recomputeCompletion(deleted.plan_id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
