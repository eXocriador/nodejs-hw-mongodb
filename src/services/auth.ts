import User from '../db/models/user';
import Session, { ISession } from '../db/models/session';
import { validateCode, verifyGoogleToken } from '../utils/googleOAuth2';
import createHttpError from 'http-errors';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { IUser } from '../types/models';
import { getEnvVar } from '../utils/getEnvVar';

const JWT_SECRET = getEnvVar('JWT_SECRET');
const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return compare(password, hashedPassword);
};

export const generateToken = (user: IUser): string => {
  const payload = { id: user._id };
  const options: SignOptions = { expiresIn: '1d' };
  return sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): { id: string } => {
  return verify(token, JWT_SECRET) as { id: string };
};

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<IUser> => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(409, 'Email already in use');
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

export const login = async (
  email: string,
  password: string
): Promise<ISession> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const accessToken = generateToken(user);
  const refreshToken = randomBytes(40).toString('hex');
  const now = new Date();
  const accessTokenValidUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
  const refreshTokenValidUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });

  return session;
};

export const loginOrSignupWithGoogle = async (
  code: string
): Promise<ISession> => {
  const ticket = await validateCode(code);
  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw createHttpError(401, 'Invalid Google token');
  }

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    const password = await hash(randomBytes(10).toString('hex'), 10);
    user = await User.create({
      email: payload.email,
      name: payload.name || 'Google User',
      password,
    });
  }

  const accessToken = generateToken(user);
  const refreshToken = randomBytes(40).toString('hex');
  const now = new Date();
  const accessTokenValidUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
  const refreshTokenValidUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });

  return session;
};

export const refresh = async (
  refreshToken: string
): Promise<ISession> => {
  const session = await Session.findOne({
    refreshToken,
    refreshTokenValidUntil: { $gt: new Date() },
  });

  if (!session) {
    throw createHttpError(401, 'Invalid refresh token');
  }

  const user = await User.findById(session.userId);
  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  const accessToken = generateToken(user);
  const newRefreshToken = randomBytes(40).toString('hex');
  const now = new Date();
  const accessTokenValidUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
  const refreshTokenValidUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const updatedSession = await Session.findByIdAndUpdate(
    session._id,
    {
      accessToken,
      refreshToken: newRefreshToken,
      accessTokenValidUntil,
      refreshTokenValidUntil,
    },
    { new: true }
  );

  if (!updatedSession) {
    throw createHttpError(500, 'Failed to update session');
  }

  return updatedSession;
};

export const logout = async (refreshToken: string): Promise<void> => {
  await Session.findOneAndDelete({ refreshToken });
};
