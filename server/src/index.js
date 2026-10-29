import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import brandkitRoutes from './routes/brandkit.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ensureDemoData } from './seed/autoSeed.js';

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
app.use('/api', workflowRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*splat', (req,res,next) => req.path.startsWith('/api') ? next() : res.sendFile(path.join(clientDist,'index.html')));
}

try { await mongoose.connect(env.mongoUri); console.log('Mongo connected'); await ensureDemoData(); }
catch (err) { console.error('Mongo error:', err.message); process.exit(1); }
app.listen(env.port, '0.0.0.0', () => console.log(`BrandSentinel listening on :${env.port}`));

export default app;
