import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

import User from '../db/models/user';
import Session from '../db/models/session';
import { IUser } from '../types/models';
import { TEMPLATES_DIR } from '../constants';
import { authSchema, loginSchema } from '../validation/auth';
import { hashPassword, comparePassword } from '../services/auth';
import { generateAuthTokens, setupSession, deleteSession, findSessionByRefreshToken } from '../services/session';
import { generateAuthUrl, validateCode } from '../utils/googleOAuth2';
import { sendEmail } from '../services/email';
import { getEnvVar } from '../utils/getEnvVar';
import { loginOrSignupWithGoogle } from '../services/auth';

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
      message: 'Successfully registered a user!',
      data: {
        accessToken,
      },
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
      message: 'Successfully logged in!',
      data: {
        accessToken,
      },
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
      data: user,
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
      data: { accessToken },
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
      return res.json({
        status: 200,
        message: 'If an account with this email exists, a password reset email has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `${getEnvVar('APP_DOMAIN', 'http://localhost:3000')}/reset-password?token=${resetToken}`;

    const templatePath = path.join(TEMPLATES_DIR, 'reset-password-email.html');
    let html = await fs.readFile(templatePath, 'utf-8');
    html = html.replace(/{{link}}/g, resetUrl);
    html = html.replace(/{{year}}/g, new Date().getFullYear().toString());

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });

    res.json({
      status: 200,
      message: 'If an account with this email exists, a password reset email has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const handleResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw createHttpError(400, 'Token is invalid or has expired');
    }

    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await Session.deleteMany({ userId: user._id });

    res.json({
      status: 200,
      message: 'Password has been successfully reset.',
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
      data: { url },
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
        accessToken,
      },
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
      { new: true },
    ).select('-password');

    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    res.json({
      status: 200,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
