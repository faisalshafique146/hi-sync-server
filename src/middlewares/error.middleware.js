import { ApiError } from '../utils/apiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode =
    err.statusCode ?? (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.name === 'MulterError' ? 400 : 500);
  const message = err.message ?? 'Internal server error';
  const details = err.details ?? null;

  if (res.headersSent) {
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}
