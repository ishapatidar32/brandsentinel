import 'dotenv/config';
export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'local-demo-secret-change-before-deploy',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
};
