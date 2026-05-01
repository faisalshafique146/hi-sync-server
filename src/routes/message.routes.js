import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { upload } from '../config/multer.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import {
  getConversationMessages,
  listConversations,
  markConversationRead,
  sendMessage
} from '../controllers/message.controller.js';

export const messageRouter = Router();

messageRouter.get('/conversations', requireAuth, listConversations);
messageRouter.get('/:userId', requireAuth, param('userId').isMongoId().withMessage('Invalid user id'), validateRequest, getConversationMessages);
messageRouter.patch('/:userId/read', requireAuth, param('userId').isMongoId().withMessage('Invalid user id'), validateRequest, markConversationRead);
messageRouter.post(
  '/',
  requireAuth,
  upload.single('image'),
  body('receiverId').isMongoId().withMessage('Valid receiverId is required'),
  body('text').optional().isString(),
  body('clientMessageId').optional().isString(),
  validateRequest,
  sendMessage
);
