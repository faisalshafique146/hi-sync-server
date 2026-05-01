import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export function validateRequest(req, _res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const details = result.array().map((error) => ({
      field: error.path,
      message: error.msg
    }));

    next(new ApiError(400, 'Validation failed', details));
    return;
  }

  next();
}
