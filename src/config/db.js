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
    const topologyType = error?.reason?.type ?? error?.cause?.type;

    if (
      ['ECONNREFUSED', 'ENOTFOUND', 'EBADNAME'].includes(error?.code) ||
      topologyType === 'ReplicaSetNoPrimary'
    ) {
      throw new Error(
        'Unable to connect to MongoDB Atlas. Check that your current IP address is allowlisted in Atlas, your database user credentials are correct, and MONGODB_URI points to the right cluster.'
      );
    }

    throw error;
  }

  return mongoose.connection;
}
