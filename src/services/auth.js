import bcrypt from 'bcryptjs';
import createHttpError from 'http-errors';
import { randomBytes } from 'crypto';

import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js';
import { THIRTY_DAYS, FIFTEEN_MINUTES } from '../constants/index.js';

const generateToken = () => randomBytes(48).toString('hex');

export const registerUser = async (payload) => {
  const { name, email, password } = payload;

  const existingUser = await UsersCollection.findOne({ email });
  if (existingUser) {
    throw createHttpError(409, 'Email already in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await UsersCollection.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await UsersCollection.findOne({ email });

  if (!user) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const accessToken = generateToken();
  const refreshToken = generateToken();

  const now = new Date();
  const accessTokenValidUntil = new Date(now.getTime() + FIFTEEN_MINUTES);
  const refreshTokenValidUntil = new Date(now.getTime() + THIRTY_DAYS);

  let session = await SessionsCollection.findOne({ userId: user._id });

  if (session) {
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.accessTokenValidUntil = accessTokenValidUntil;
    session.refreshTokenValidUntil = refreshTokenValidUntil;
    await session.save();
  } else {
    session = await SessionsCollection.create({
      userId: user._id,
      accessToken,
      refreshToken,
      accessTokenValidUntil,
      refreshTokenValidUntil,
    });
  }

  return {
    ...session.toObject(),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

export const logoutUser = async (sessionId) => {
  await SessionsCollection.findByIdAndDelete(sessionId);
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
  const session = await SessionsCollection.findById(sessionId);

  if (
    !session ||
    session.refreshToken !== refreshToken ||
    new Date() > new Date(session.refreshTokenValidUntil)
  ) {
    throw createHttpError(401, 'Invalid or expired refresh token');
  }

  const newAccessToken = generateToken();
  const newRefreshToken = generateToken();

  const now = new Date();
  const newAccessTokenValidUntil = new Date(now.getTime() + FIFTEEN_MINUTES);
  const newRefreshTokenValidUntil = new Date(now.getTime() + THIRTY_DAYS);

  session.accessToken = newAccessToken;
  session.refreshToken = newRefreshToken;
  session.accessTokenValidUntil = newAccessTokenValidUntil;
  session.refreshTokenValidUntil = newRefreshTokenValidUntil;

  await session.save();

  return session.toObject();
};
