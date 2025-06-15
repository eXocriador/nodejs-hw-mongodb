import { Request, Response, NextFunction } from 'express';
import User from '../db/models/user';
import Session from '../db/models/session';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  refreshTokens,
  invalidateSession,
  invalidateAllSessions,
  loginOrSignupWithGoogle
} from '../services/auth';
import {
  generateAuthTokens,
  setupSession,
  deleteSession,
  findSessionByRefreshToken
} from '../services/session';
import createHttpError from 'http-errors';
import { authSchema, loginSchema } from '../validation/auth';
import { IUser } from '../types/models';
import { generateAuthUrl } from '../utils/googleOAuth2';
import { sendEmail } from '../services/email';
import jwt from 'jsonwebtoken';
import { getEnvVar } from '../utils/getEnvVar';

const JWT_SECRET = getEnvVar('JWT_SECRET');

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = authSchema.validate(req.body);
    if (error) {
      throw createHttpError(400, error.message);
    }

    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(409, 'Email in use');
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateAuthTokens(user);
    await setupSession(user, accessToken, refreshToken, res);

    res.status(201).json({
      status: 201,
      message: "Successfully registered a user!",
      data: {
        user: user.toObject(),
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      throw createHttpError(400, error.message);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(401, 'Email or password is wrong');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Email or password is wrong');
    }

    const { accessToken, refreshToken } = generateAuthTokens(user);
    await setupSession(user, accessToken, refreshToken, res);

    res.json({
      status: 200,
      message: "Successfully logged in!",
      data: {
        user: user.toObject(),
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await deleteSession(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      throw createHttpError(404, 'User not found');
    }
    res.json({
      status: 200,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw createHttpError(401, 'Refresh token not found');
    }

    const session = await findSessionByRefreshToken(refreshToken);
    if (!session) {
      throw createHttpError(401, 'Invalid refresh token');
    }

    const user = await User.findById(session.userId);
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateAuthTokens(user);
    await setupSession(user, accessToken, newRefreshToken, res);

    res.json({
      status: 200,
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
};

export const sendResetEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const { accessToken } = generateAuthTokens(user);
    await sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `Click here to reset your password: ${accessToken}`
    });

    res.json({
      status: 200,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
};

export const handleResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    await Session.deleteMany({ userId: user._id });

    res.json({
      status: 200,
      message: 'Password successfully reset'
    });
  } catch (error) {
    next(error);
  }
};

export const getGoogleOAuthUrlController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = generateAuthUrl();
    res.json({
      status: 200,
      data: { url }
    });
  } catch (error) {
    next(error);
  }
};

export const loginWithGoogleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    const { user } = await loginOrSignupWithGoogle(code);

    const { accessToken, refreshToken } = generateAuthTokens(user);
    await setupSession(user, accessToken, refreshToken, res);

    res.json({
      status: 200,
      message: 'Successfully logged in with Google',
      data: {
        user: user.toObject(),
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw createHttpError(401, 'User not authenticated');
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw createHttpError(409, 'Email already in use');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    res.json({
      status: 200,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
