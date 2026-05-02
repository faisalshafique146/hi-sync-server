import { buildAssetUrl, colorFromString, createInitials } from './avatars.js';

export function serializeAuthUser(user, req) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    handle: user.username,
    role: user.role,
    avatarInitials: createInitials(user.fullName),
    profilePic: buildAssetUrl(req, user.profilePic),
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
    updatedAt: user.updatedAt?.toISOString?.() ?? user.updatedAt
  };
}

export function serializeChatUser(user, req, presence = 'offline', statusMessage = 'Available') {
  return {
    id: String(user._id),
    name: user.fullName,
    accentColor: colorFromString(user.username ?? user.email ?? String(user._id)),
    avatarUrl: buildAssetUrl(req, user.profilePic),
    presence,
    statusMessage
  };
}

export function serializeMessage(message, req) {
  return {
    id: String(message._id),
    conversationKey: String(message.conversationKey),
    senderId: String(message.senderId),
    receiverId: String(message.receiverId),
    content: message.text,
    imageUrl: buildAssetUrl(req, message.image),
    timestamp: message.createdAt?.toISOString?.() ?? message.createdAt,
    status: message.status,
    clientMessageId: message.clientMessageId ?? undefined
  };
}
