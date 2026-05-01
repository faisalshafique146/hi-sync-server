import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'node:path';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { uploadsDir } from './config/multer.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.use('/uploads', express.static(path.resolve(uploadsDir)));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'chat-api', timestamp: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'chat-api',
      message: 'Chat API is running',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        users: '/api/users',
        messages: '/api/messages'
      }
    });
  });

  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
