import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10_000
    });
  } catch (error) {
    if (['ECONNREFUSED', 'ENOTFOUND', 'EBADNAME'].includes(error?.code)) {
      throw new Error(
        'Unable to reach MongoDB Atlas. Check your network access, IP allowlist, and that MONGODB_URI is a valid Atlas connection string.'
      );
    }

    throw error;
  }

  return mongoose.connection;
}
