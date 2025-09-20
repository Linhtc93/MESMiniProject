import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { ensureDefaultAdmin } from './config/bootstrap.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    // Ensure a default admin exists on first startup in new environments
    try {
      const res = await ensureDefaultAdmin();
      if (res?.created) {
        console.log('Default admin created');
      } else {
        console.log('Admin check:', res?.reason || 'exists');
      }
    } catch (e) {
      console.warn('ensureDefaultAdmin error:', e?.message || e);
    }
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
