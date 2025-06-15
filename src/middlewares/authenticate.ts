import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomRequest } from '../types/index';
import User from '../db/models/user';
import Session from '../db/models/session';
import { getEnvVar } from '../utils/getEnvVar';
import createHttpError from 'http-errors';

const JWT_SECRET = getEnvVar('JWT_SECRET');

export const authenticate = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw createHttpError(401, 'Authentication required');
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      throw createHttpError(401, 'Authentication required');
    }

    let decoded: { id: string, exp: number };
    try {
      decoded = jwt.verify(accessToken, JWT_SECRET) as { id: string, exp: number };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw createHttpError(401, 'Access token expired');
      }
      throw createHttpError(401, 'Invalid access token');
    }

    const session = await Session.findOne({
      userId: decoded.id,
      accessToken: accessToken,
      accessTokenValidUntil: { $gt: new Date() }
    });

    if (!session) {
      throw createHttpError(401, 'Authentication required: No active session or token invalid.');
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      throw createHttpError(401, 'Authentication required: User not found.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (createHttpError.isHttpError(error)) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
