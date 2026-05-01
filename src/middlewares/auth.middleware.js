import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [, token] = header.split(' ');

  if (!token) {
    next(new ApiError(401, 'Authorization token is required'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}
