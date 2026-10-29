import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import brandkitRoutes from './routes/brandkit.routes.js';

const app = express();

app.set('trust proxy', 1); // needed on Render for rate limiting
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Health check routes
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/check', (req, res) => res.send('working'));

// API routes
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', brandkitRoutes);
app.use('/api/brandkit', brandkitRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

try {
  await mongoose.connect(env.mongoUri);
  console.log('Mongo connected');
} catch (err) {
  console.error('Mongo error:', err.message);
  process.exit(1);
}

app.listen(env.port, () => console.log(`API on :${env.port}`));

export default app;
