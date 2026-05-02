import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { serializeChatUser, serializeAuthUser } from '../utils/serializers.js';
import { uploadBufferToTigris } from '../services/tigris-storage.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, 'Profile loaded', { user: serializeAuthUser(user, req) }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const fullName = String(req.body.fullName ?? '').trim();
  const forbiddenKeys = ['email', 'username', 'handle'];

  if (forbiddenKeys.some((key) => key in req.body)) {
    throw new ApiError(400, 'Email and username cannot be changed');
  }

  if (!fullName) {
    throw new ApiError(400, 'Full name is required');
  }

  if (fullName.length < 3) {
    throw new ApiError(400, 'Full name must be at least 3 characters');
  }

  user.fullName = fullName;

  if (req.file) {
    try {
      const uploaded = await uploadBufferToTigris({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        prefix: 'profile-pics'
      });

      user.profilePic = uploaded.url;
    } catch (error) {
      console.error('[profile upload failed]', {
        userId: String(user._id),
        name: error?.name,
        message: error?.message
      });
    }
  }

  await user.save();

  res.json(
    new ApiResponse(200, 'Profile updated successfully', {
      user: serializeAuthUser(user, req)
    })
  );
});

export const updateProfileName = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const fullName = String(req.body.fullName ?? '').trim();

  if (!fullName) {
    throw new ApiError(400, 'Full name is required');
  }

  if (fullName.length < 3) {
    throw new ApiError(400, 'Full name must be at least 3 characters');
  }

  user.fullName = fullName;
  await user.save();

  res.json(
    new ApiResponse(200, 'Profile updated successfully', {
      user: serializeAuthUser(user, req)
    })
  );
});

export const updateProfileAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!req.file) {
    throw new ApiError(400, 'Profile image is required');
  }

  const uploaded = await uploadBufferToTigris({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    prefix: 'profile-pics'
  });

  user.profilePic = uploaded.url;
  await user.save();

  res.json(
    new ApiResponse(200, 'Profile image updated successfully', {
      user: serializeAuthUser(user, req)
    })
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const currentPassword = String(req.body.currentPassword ?? '');
  const newPassword = String(req.body.newPassword ?? '');

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json(
    new ApiResponse(200, 'Password updated successfully', {
      user: serializeAuthUser(user, req)
    })
  );
});

export const listUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user.sub;
  const users = await User.find({ _id: { $ne: currentUserId } }).sort({ fullName: 1 });

  res.json(
    new ApiResponse(200, 'Users loaded', {
      users: users.map((user) =>
        serializeChatUser(
          user,
          req,
          'offline',
          user.statusMessage || 'Available'
        )
      )
    })
  );
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(
    new ApiResponse(200, 'User loaded', {
      user: serializeChatUser(user, req, 'offline', user.statusMessage || 'Available')
    })
  );
});
