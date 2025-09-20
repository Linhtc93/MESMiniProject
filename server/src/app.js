import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import operationRoutes from './routes/operations.routes.js';
import bomRoutes from './routes/boms.routes.js';
import employeeRoutes from './routes/employees.routes.js';
import planRoutes from './routes/plans.routes.js';
import outputRoutes from './routes/outputs.routes.js';

const app = express();

// Configure CORS to allow frontend domain (e.g., Vercel) in production
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: allowedOrigin !== '*',
}));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/outputs', outputRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
