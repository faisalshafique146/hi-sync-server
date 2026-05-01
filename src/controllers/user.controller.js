import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { serializeChatUser, serializeAuthUser } from '../utils/serializers.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, 'Profile loaded', { user: serializeAuthUser(user, req) }));
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
