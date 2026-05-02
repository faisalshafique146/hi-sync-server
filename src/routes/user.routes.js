import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { upload } from '../config/multer.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  changePassword,
  getProfile,
  getUserById,
  listUsers,
  updateProfile,
  updateProfileAvatar,
  updateProfileName
} from '../controllers/user.controller.js';

export const userRouter = Router();

userRouter.get('/me', requireAuth, getProfile);
userRouter.patch(
  '/me',
  requireAuth,
  upload.single('profilePic'),
  body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  validateRequest,
  updateProfile
);
userRouter.patch(
  '/me/name',
  requireAuth,
  body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  validateRequest,
  updateProfileName
);
userRouter.patch('/me/avatar', requireAuth, upload.single('profilePic'), updateProfileAvatar);
userRouter.patch(
  '/me/password',
  requireAuth,
  body('currentPassword').isLength({ min: 8 }).withMessage('Current password must be at least 8 characters'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmNewPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('New passwords do not match'),
  validateRequest,
  changePassword
);
userRouter.get('/', requireAuth, listUsers);
userRouter.get('/:userId', requireAuth, getUserById);
