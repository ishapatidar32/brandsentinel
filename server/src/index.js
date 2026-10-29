
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import brandkitRoutes from './routes/brandkit.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import { ensureDemoData } from './seed/autoSeed.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

app.set('trust proxy', 1);

app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Health checks
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/check', (req, res) => {
  res.send('working');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/brandkit', brandkitRoutes);
app.use('/api', authRoutes);
app.use('/api', brandkitRoutes);
app.use('/api', workflowRoutes);

// Serve the built frontend, if available
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Support React client-side routes.
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

// Keep error handlers last
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Mongo connected');

    await ensureDemoData();

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`BrandSentinel listening on port ${env.port}`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}

startServer();

export default app;
