import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4200',
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  maxUploadSizeBytes: toNumber(process.env.MAX_UPLOAD_SIZE_BYTES, 5 * 1024 * 1024)
};

export function assertEnv() {
  const missing = [];

  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET');
  if (!env.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
