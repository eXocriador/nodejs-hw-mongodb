import createHttpError from 'http-errors';
import { SessionsCollection } from '../db/models/session.js';
import { UsersCollection } from '../db/models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      throw createHttpError(401, 'Authorization header required');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw createHttpError(401, 'Invalid Authorization header format');
    }

    const session = await SessionsCollection.findOne({ accessToken: token });

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    if (new Date() > new Date(session.accessTokenValidUntil)) {
      throw createHttpError(401, 'Access token expired');
    }

    const user = await UsersCollection.findById(session.userId);

    if (!user) {
      throw createHttpError(401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
