import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from './env.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = extension && extension.length <= 6 ? extension : '';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    cb(null, uniqueName);
  }
});

const imageMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

export const upload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadSizeBytes
  },
  fileFilter: (_req, file, cb) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      const error = new Error('Only image uploads are allowed.');
      error.statusCode = 400;
      cb(error);
      return;
    }

    cb(null, true);
  }
});

export { uploadsDir };
