import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sent'
    },
    conversationKey: {
      type: String,
      required: true,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationKey: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
