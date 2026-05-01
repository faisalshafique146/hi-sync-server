import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { loadChatBootstrap } from '../utils/chat-data.js';

function getSocketRequestLike(socket) {
  const host = socket.request.headers.host ?? 'localhost:3000';
  const protocol = String(socket.request.headers['x-forwarded-proto'] ?? 'http').split(',')[0];

  return {
    protocol,
    get: (key) => (String(key).toLowerCase() === 'host' ? host : '')
  };
}

function getUserRoomMap(app) {
  if (!app.get('userSocketMap')) {
    app.set('userSocketMap', new Map());
  }

  return app.get('userSocketMap');
}

function getOnlineSet(app) {
  if (!app.get('onlineUserIds')) {
    app.set('onlineUserIds', new Set());
  }

  return app.get('onlineUserIds');
}

function addSocketForUser(app, userId, socketId) {
  const socketMap = getUserRoomMap(app);
  const current = socketMap.get(userId) ?? new Set();
  const wasOffline = current.size === 0;
  current.add(socketId);
  socketMap.set(userId, current);
  getOnlineSet(app).add(userId);
  return wasOffline;
}

function removeSocketForUser(app, userId, socketId) {
  const socketMap = getUserRoomMap(app);
  const current = socketMap.get(userId);

  if (!current) {
    return false;
  }

  current.delete(socketId);

  if (current.size === 0) {
    socketMap.delete(userId);
    getOnlineSet(app).delete(userId);
    return true;
  }

  socketMap.set(userId, current);
  return false;
}

function emitPresenceUpdate(io, onlineUserIds, payload, excludeUserId = null) {
  for (const targetUserId of onlineUserIds) {
    if (excludeUserId && String(targetUserId) === String(excludeUserId)) {
      continue;
    }

    io.to(String(targetUserId)).emit('chat:presence', payload);
  }
}

async function resolveSocketUser(socket) {
  const { token, userId } = socket.handshake.auth ?? {};

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const resolvedUserId = String(payload.sub);

    if (userId && String(userId) !== resolvedUserId) {
      return null;
    }

    const user = await User.findById(resolvedUserId);

    if (!user) {
      return null;
    }

    return { user, userId: resolvedUserId };
  } catch {
    return null;
  }
}

export function registerChatSockets(io, app) {
  const onlineUserIds = getOnlineSet(app);
  const userSocketMap = getUserRoomMap(app);

  io.on('connection', async (socket) => {
    const resolved = await resolveSocketUser(socket);

    if (!resolved) {
      socket.emit('chat:error', 'Unauthorized socket connection');
      socket.disconnect(true);
      return;
    }

    const { user, userId } = resolved;
    const socketRequestLike = getSocketRequestLike(socket);

    socket.data.userId = userId;
    socket.join(userId);
    const shouldBroadcastOnline = addSocketForUser(app, userId, socket.id);

    if (shouldBroadcastOnline) {
      emitPresenceUpdate(io, onlineUserIds, {
        userId,
        presence: 'online'
      });
    }

    socket.on('chat:sync', async (payload = {}) => {
      const snapshot = await loadChatBootstrap(
        userId,
        socketRequestLike,
        onlineUserIds,
        payload.roomId ?? null
      );

      if (!snapshot) {
        socket.emit('chat:error', 'Unable to load chat snapshot');
        return;
      }

      socket.emit('chat:snapshot', snapshot);
    });

    socket.on('chat:join', (payload = {}) => {
      const { roomId } = payload;

      if (roomId) {
        socket.join(roomId);
      }
    });

    socket.on('chat:leave', (payload = {}) => {
      const { roomId } = payload;

      if (roomId) {
        socket.leave(roomId);
      }
    });

    socket.on('chat:typing', (payload) => {
      if (!payload?.roomId) {
        return;
      }

      socket.to(payload.roomId).emit('chat:typing', payload);
    });

    socket.on('disconnect', () => {
      const shouldBroadcastOffline = removeSocketForUser(app, userId, socket.id);

      if (shouldBroadcastOffline) {
        emitPresenceUpdate(io, onlineUserIds, {
          userId,
          presence: 'offline'
        });
      }
    });
  });

  app.set('onlineUserIds', onlineUserIds);
  app.set('userSocketMap', userSocketMap);
}
