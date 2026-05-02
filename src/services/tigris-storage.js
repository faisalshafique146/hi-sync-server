import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const s3Client = new S3Client({
  region: env.tigrisRegion || 'auto',
  endpoint: env.tigrisEndpoint || 'https://fly.storage.tigris.dev',
  credentials: {
    accessKeyId: env.tigrisAccessKeyId,
    secretAccessKey: env.tigrisSecretAccessKey
  }
});

function createObjectKey(prefix, originalName = '', mimeType = '') {
  const extension = path.extname(originalName || '').toLowerCase();
  const safeExtension = extension && extension.length <= 8 ? extension : guessExtension(mimeType);
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;

  return prefix ? `${prefix}/${uniqueName}` : uniqueName;
}

function guessExtension(mimeType = '') {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
}

function buildPublicUrl(key) {
  const baseUrl = env.tigrisPublicBaseUrl.replace(/\/$/, '');
  return `${baseUrl}/${key.replace(/^\/+/, '')}`;
}

export async function uploadBufferToTigris({
  buffer,
  originalName,
  mimeType,
  prefix = ''
}) {
  if (!buffer || buffer.length === 0) {
    throw new ApiError(400, 'Uploaded file is empty');
  }

  const key = createObjectKey(prefix, originalName, mimeType);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.tigrisBucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );
  } catch (error) {
    console.error('[tigris upload failed]', {
      bucket: env.tigrisBucketName,
      key,
      name: error?.name,
      message: error?.message,
      code: error?.code,
      requestId: error?.$metadata?.requestId,
      httpStatusCode: error?.$metadata?.httpStatusCode
    });

    throw new ApiError(502, 'Failed to upload file to object storage', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      requestId: error?.$metadata?.requestId,
      httpStatusCode: error?.$metadata?.httpStatusCode
    });
  }

  return {
    key,
    url: buildPublicUrl(key)
  };
}
