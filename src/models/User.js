import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    profilePic: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['member', 'owner', 'admin'],
      default: 'member'
    },
    statusMessage: {
      type: String,
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model('User', userSchema);
