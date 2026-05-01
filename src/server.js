import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env, assertEnv } from './config/env.js';
import { registerChatSockets } from './socket/chat.socket.js';

async function bootstrap() {
  assertEnv();

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    },
    path: '/socket.io'
  });

  app.set('io', io);
  app.set('onlineUserIds', new Set());
  app.set('userSocketMap', new Map());

  registerChatSockets(io, app);

  server.listen(env.port, () => {
    console.log(`Chat API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
