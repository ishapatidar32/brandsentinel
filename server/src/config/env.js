import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from cwd, server root, and repo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export let env;

try {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);

  env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpires: process.env.JWT_EXPIRES || '1d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  };
} catch (err) {
  console.error('Config error:', err.message);
  process.exit(1);
}
