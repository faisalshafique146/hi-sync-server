import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 3000),
  clientOrigin: process.env.PRODUCTION_CLIENT_ORIGIN ?? process.env.CLIENT_ORIGIN,
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  maxUploadSizeBytes: toNumber(process.env.MAX_UPLOAD_SIZE_BYTES, 5 * 1024 * 1024),
  tigrisBucketName: process.env.TIGRIS_BUCKET_NAME ?? process.env.BUCKET_NAME ?? '',
  tigrisAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? process.env.TIGRIS_ACCESS_KEY_ID ?? '',
  tigrisSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? process.env.TIGRIS_SECRET_ACCESS_KEY ?? '',
  tigrisEndpoint: process.env.AWS_ENDPOINT_URL_S3 ?? process.env.TIGRIS_ENDPOINT ?? 'https://fly.storage.tigris.dev',
  tigrisRegion: process.env.AWS_REGION ?? process.env.TIGRIS_REGION ?? 'auto',
  tigrisPublicBaseUrl:
    process.env.TIGRIS_PUBLIC_BASE_URL ??
    process.env.TIGRIS_CUSTOM_DOMAIN ??
    (process.env.TIGRIS_BUCKET_NAME || process.env.BUCKET_NAME
      ? `https://${process.env.TIGRIS_BUCKET_NAME || process.env.BUCKET_NAME}.t3.tigrisfiles.io`
      : '')
};

export function assertEnv() {
  const missing = [];

  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET');
  if (!env.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET');
  if (!env.tigrisBucketName) missing.push('TIGRIS_BUCKET_NAME or BUCKET_NAME');
  if (!env.tigrisAccessKeyId) missing.push('AWS_ACCESS_KEY_ID');
  if (!env.tigrisSecretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY');
  if (!env.tigrisRegion) missing.push('AWS_REGION');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
