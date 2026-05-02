import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { makeConversationKey, loadConversation, loadChatBootstrap, serializeMessageForUser } from '../utils/chat-data.js';
import { uploadBufferToTigris } from '../services/tigris-storage.js';

function getIo(req) {
  return req.app.get('io');
}

export const listConversations = asyncHandler(async (req, res) => {
  const snapshot = await loadChatBootstrap(req.user.sub, req, req.app.get('onlineUserIds') ?? new Set(), null);

  if (!snapshot) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, 'Conversations loaded', snapshot));
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user.sub;
  const { userId } = req.params;

  const contact = await User.findById(userId);
  if (!contact) {
    throw new ApiError(404, 'Conversation contact not found');
  }

  const messages = await loadConversation(currentUserId, userId, req);

  res.json(
    new ApiResponse(200, 'Messages loaded', {
      roomId: String(userId),
      messages,
      contactId: String(userId)
    })
  );
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text, clientMessageId } = req.body;
  const currentUserId = req.user.sub;
  const sender = await User.findById(currentUserId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) {
    throw new ApiError(404, 'Sender or receiver not found');
  }

  const trimmedText = String(text ?? '').trim();
  const hasImage = req.file
    ? (
        await uploadBufferToTigris({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          prefix: 'chat-images'
        })
      ).url
    : null;

  if (!trimmedText && !hasImage) {
    throw new ApiError(400, 'Message text or image is required');
  }

  const conversationKey = makeConversationKey(currentUserId, receiverId);
  const onlineUserIds = req.app.get('onlineUserIds') ?? new Set();
  const isReceiverOnline = onlineUserIds.has(String(receiverId));

  const message = await Message.create({
    senderId: currentUserId,
    receiverId,
    text: trimmedText,
    image: hasImage,
    status: isReceiverOnline ? 'delivered' : 'sent',
    conversationKey,
    readAt: null
  });

  const io = getIo(req);
  const serializedForSender = {
    ...serializeMessageForUser(message, req, currentUserId),
    clientMessageId: clientMessageId ?? null
  };
  const serializedForReceiver = {
    ...serializeMessageForUser(message, req, receiverId),
    clientMessageId: clientMessageId ?? null
  };

  if (io) {
    io.to(String(currentUserId)).emit('chat:message', serializedForSender);
    io.to(String(receiverId)).emit('chat:message', serializedForReceiver);
    io.to(String(receiverId)).emit('chat:message-status', {
      roomId: String(currentUserId),
      messageId: String(message._id),
      status: message.status
    });
    io.to(String(currentUserId)).emit('chat:message-status', {
      roomId: String(receiverId),
      messageId: String(message._id),
      status: message.status
    });
  }

  res.status(201).json(
    new ApiResponse(201, 'Message sent', {
      message: serializedForSender
    })
  );
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user.sub;
  const { userId } = req.params;

  const result = await Message.updateMany(
    {
      senderId: userId,
      receiverId: currentUserId,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );

  const io = getIo(req);

  if (io) {
    io.to(String(userId)).emit('chat:message-status', {
      roomId: String(currentUserId),
      messageId: '*',
      status: 'read',
      readerId: String(currentUserId)
    });
    io.to(String(currentUserId)).emit('chat:message-status', {
      roomId: String(userId),
      messageId: '*',
      status: 'read',
      readerId: String(currentUserId)
    });
  }

  res.json(
    new ApiResponse(200, 'Conversation marked as read', {
      modifiedCount: result.modifiedCount
    })
  );
});
