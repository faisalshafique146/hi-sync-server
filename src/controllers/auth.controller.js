import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { serializeAuthUser } from '../utils/serializers.js';

function createTokenPair(userId) {
  return {
    accessToken: jwt.sign({ sub: String(userId) }, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpiresIn
    }),
    refreshToken: jwt.sign({ sub: String(userId) }, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiresIn
    })
  };
}

export const signup = asyncHandler(async (req, res) => {
  const { fullName, username, handle, email, password } = req.body;

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedUsername = String(username ?? handle ?? '')
    .toLowerCase()
    .trim()
    .replace(/^@+/, '');

  if (!normalizedUsername) {
    throw new ApiError(400, 'Username is required');
  }

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
  });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email or username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  const user = await User.create({
    fullName: String(fullName).trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    profilePic
  });

  const tokenPair = createTokenPair(user._id);

  res.status(201).json(
    new ApiResponse(201, 'Account created successfully', {
      user: serializeAuthUser(user, req),
      ...tokenPair,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString()
    })
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokenPair = createTokenPair(user._id);

  res.json(
    new ApiResponse(200, 'Login successful', {
      user: serializeAuthUser(user, req),
      ...tokenPair,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString()
    })
  );
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, 'Authenticated user not found');
  }

  res.json(new ApiResponse(200, 'Current user loaded', { user: serializeAuthUser(user, req) }));
});
