import { Router } from 'express';
import { body } from 'express-validator';
import { login, getMe, signup } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { upload } from '../config/multer.js';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

export const authRouter = Router();

authRouter.post(
  '/signup',
  authLimiter,
  upload.single('profilePic'),
  body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('handle')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Handle must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('acceptTerms').optional().toBoolean().isBoolean().withMessage('acceptTerms must be a boolean'),
  validateRequest,
  signup
);

authRouter.post(
  '/login',
  authLimiter,
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validateRequest,
  login
);

authRouter.get('/me', requireAuth, getMe);
