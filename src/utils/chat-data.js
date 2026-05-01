import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { serializeAuthUser, serializeChatUser, serializeMessage } from './serializers.js';

export function makeConversationKey(leftId, rightId) {
  return [String(leftId), String(rightId)].sort().join(':');
}

export async function loadChatBootstrap(currentUserId, req, onlineUserIds = new Set(), activeRoomId = null) {
  const [currentUser, contacts, allMessages] = await Promise.all([
    User.findById(currentUserId),
    User.find({ _id: { $ne: currentUserId } }).sort({ fullName: 1 }),
    Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    }).sort({ createdAt: 1 })
  ]);

  if (!currentUser) {
    return null;
  }

  const messagesByRoom = {};
  const roomMap = new Map();

  for (const contact of contacts) {
    const roomId = String(contact._id);
    roomMap.set(roomId, {
      id: roomId,
      participantIds: [String(currentUser._id), roomId],
      unreadCount: 0,
      updatedAt: contact.createdAt?.toISOString?.() ?? new Date().toISOString()
    });
    messagesByRoom[roomId] = [];
  }

  for (const message of allMessages) {
    const roomId = String(message.senderId) === String(currentUser._id)
      ? String(message.receiverId)
      : String(message.senderId);

    if (!messagesByRoom[roomId]) {
      messagesByRoom[roomId] = [];
    }

    const serializedMessage = serializeMessageForUser(message, req, currentUser._id);
    messagesByRoom[roomId].push(serializedMessage);

    const room = roomMap.get(roomId);
    if (room) {
      room.updatedAt = serializedMessage.timestamp;
      if (String(message.receiverId) === String(currentUser._id) && message.status !== 'read') {
        room.unreadCount += 1;
      }
    }
  }

  const users = contacts.map((contact) =>
    serializeChatUser(
      contact,
      req,
      onlineUserIds.has(String(contact._id)) ? 'online' : 'offline',
      contact.statusMessage || 'Available'
    )
  );

  const rooms = [...roomMap.values()].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

  return {
    currentUser: {
      ...serializeChatUser(currentUser, req, 'online', currentUser.statusMessage || 'Available'),
      fullName: currentUser.fullName,
      email: currentUser.email,
      handle: currentUser.username,
      role: currentUser.role,
      avatarInitials: serializeAuthUser(currentUser, req).avatarInitials,
      createdAt: currentUser.createdAt?.toISOString?.() ?? currentUser.createdAt,
      profilePic: serializeAuthUser(currentUser, req).profilePic
    },
    users,
    rooms,
    messagesByRoom,
    activeRoomId: activeRoomId ?? rooms[0]?.id ?? null
  };
}

export async function loadConversation(currentUserId, otherUserId, req) {
  const conversationKey = makeConversationKey(currentUserId, otherUserId);

  const messages = await Message.find({ conversationKey }).sort({ createdAt: 1 });

  return messages.map((message) => serializeMessageForUser(message, req, currentUserId));
}

export function serializeMessageForUser(message, req, currentUserId) {
  const roomId = String(message.senderId) === String(currentUserId)
    ? String(message.receiverId)
    : String(message.senderId);

  return {
    ...serializeMessage(message, req),
    roomId
  };
}
