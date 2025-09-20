import { Router } from 'express';
import Operation from '../models/Operation.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', auth(false), async (req, res, next) => {
  try {
    const items = await Operation.find({ is_deleted: 0 }).sort({ operation_code: 1 }).limit(500);
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.created_by = req.user?.username;
    const created = await Operation.create(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.put('/:operation_code', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const data = req.body;
    data.updated_by = req.user?.username;
    data.updated_at = new Date();
    const updated = await Operation.findOneAndUpdate(
      { operation_code: req.params.operation_code },
      { $set: data },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:operation_code', auth(), requireRoles(['Admin', 'Planner']), async (req, res, next) => {
  try {
    const updated = await Operation.findOneAndUpdate(
      { operation_code: req.params.operation_code },
      { $set: { is_deleted: 1, updated_by: req.user?.username, updated_at: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
