import multer from 'multer';
import { env } from './env.js';

const imageMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

export const upload = multer({
  storage: multer.memoryStorage(),
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
