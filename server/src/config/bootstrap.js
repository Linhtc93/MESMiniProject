import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function ensureDefaultAdmin() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
  const rolesEnv = process.env.DEFAULT_ADMIN_ROLES || 'Admin';
  const roles = rolesEnv.split(',').map(r => r.trim()).filter(Boolean);

  const hasAdmin = await User.findOne({ roles: { $in: ['Admin'] } });
  if (hasAdmin) {
    return { created: false, reason: 'Admin already exists' };
  }
  const existing = await User.findOne({ username });
  if (existing) {
    // If username exists but not admin, upgrade roles to include Admin
    if (!existing.roles.includes('Admin')) {
      existing.roles = Array.from(new Set([...existing.roles, 'Admin']));
      await existing.save();
    }
    return { created: false, reason: 'User exists, ensured Admin role' };
  }
  const password_hash = await bcrypt.hash(password, 10);
  await User.create({ username, password_hash, roles: roles.length ? roles : ['Admin'] });
  return { created: true };
}
