import Session, { ISession } from '../db/models/session.ts';
import { IUser } from '../types/models.ts';
import jwt from 'jsonwebtoken';
import { getEnvVar } from '../utils/getEnvVar.ts';
import createHttpError from 'http-errors';
import { Response } from 'express';

const JWT_SECRET = getEnvVar('JWT_SECRET');

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const generateAuthTokens = (user: IUser): Tokens => {
  const payload = { id: user._id };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const createSession = async (user: IUser, accessToken: string, refreshToken: string): Promise<ISession> => {
  const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  const refreshTokenValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Remove any existing sessions for the user to ensure only one active session
  await Session.deleteMany({ userId: user._id });

  const session = await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });
  return session;
};

export const deleteSession = async (refreshToken: string): Promise<void> => {
  await Session.deleteOne({ refreshToken });
};

export const findSessionByRefreshToken = async (refreshToken: string): Promise<ISession | null> => {
  const session = await Session.findOne({ refreshToken });
  if (!session) {
    throw createHttpError(401, 'Session not found for refresh token.');
  }
  if (new Date() > session.refreshTokenValidUntil) {
    throw createHttpError(401, 'Refresh token expired.');
  }
  return session;
};

export const setupSession = (res: Response, session: ISession): void => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: session.refreshTokenValidUntil,
  });
};
