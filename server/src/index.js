import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import notFound from './middleware/errorHandler.js';
import errorHandler from './middleware/errorHandler.js';
import brandkitRoutes from './routes/brandkit.routes.js';
const app = express();
app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('api/auth', authRoutes);
app.use('api/brankit', brandKitRoutes)

app.use(notFound);
app.use(errorHandler);

await mongoose.connect(env.mongoUri);
app.listen(env.port, () => console.log(`API on :${env.port}`));