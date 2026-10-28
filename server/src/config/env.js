import 'dotenv/config';

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