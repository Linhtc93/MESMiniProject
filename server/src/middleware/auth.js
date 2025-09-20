import jwt from 'jsonwebtoken';

export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ message: 'Unauthorized' });
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      req.user = payload;
      next();
    } catch (e) {
      if (required) return res.status(401).json({ message: 'Invalid token' });
      next();
    }
  };
}

export function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!roles.length) return next();
    const userRoles = req.user?.roles || [];
    const ok = roles.some(r => userRoles.includes(r));
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
