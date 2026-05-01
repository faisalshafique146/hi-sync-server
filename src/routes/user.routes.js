import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getProfile, getUserById, listUsers } from '../controllers/user.controller.js';

export const userRouter = Router();

userRouter.get('/me', requireAuth, getProfile);
userRouter.get('/', requireAuth, listUsers);
userRouter.get('/:userId', requireAuth, getUserById);
