import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, roles = ['Viewer'], employee_code } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username & password required' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'Username already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password_hash, roles, employee_code });
    res.json({ id: user._id, username: user.username, roles: user.roles });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, is_active: true });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user._id, username: user.username, roles: user.roles }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: process.env.JWT_EXPIRES || '7d' });
    res.json({ token, user: { id: user._id, username: user.username, roles: user.roles } });
  } catch (e) { next(e); }
});

export default router;
