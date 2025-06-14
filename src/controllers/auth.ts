import createHttpError from 'http-errors';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';

import { IUser } from '../types/models.ts';
import { CustomRequest } from '../types/index.ts';
import { hashPassword, comparePassword } from '../services/auth.ts';
import { authSchema, loginSchema, requestResetEmailSchema, resetPasswordSchema } from '../validation/auth.ts';
import User from '../db/models/user.ts';
import Session from '../db/models/session.ts';
import { generateAuthTokens, createSession, deleteSession, findSessionByRefreshToken, setupSession } from '../services/session.ts';
import { ctrlWrapper } from '../utils/ctrlWrapper.ts';
import { getEnvVar } from '../utils/getEnvVar.ts';
import { sendEmail } from '../services/email.ts';
import { TEMPLATES_DIR } from '../constants/index.ts';
import { generateAuthUrl } from '../utils/googleOAuth2.ts';
import { loginOrSignupWithGoogle } from '../services/auth.ts';


const JWT_SECRET = getEnvVar('JWT_SECRET');

export const register = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
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

  await User.create({
    name,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    status: 201,
    message: "Successfully registered a user!",
    data: {}
  });
});

export const login = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
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
  await createSession(user, accessToken, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  res.json({
    status: 200,
    message: "Successfully logged in an user!",
    data: { accessToken }
  });
});

export const logout = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await deleteSession(refreshToken);
  }
  res.clearCookie('refreshToken');
  res.status(204).send();
});

export const getCurrentUser = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const user = req.user as IUser;
  res.json({
    status: 200,
    message: "Successfully retrieved current user!",
    data: {
      user: {
        email: user.email,
        subscription: user.subscription,
      }
    }
  });
});

export const refresh = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { refreshToken: oldRefreshToken } = req.cookies;
  if (!oldRefreshToken) {
    throw createHttpError(401, 'Refresh token not found in cookies.');
  }

  const session = await findSessionByRefreshToken(oldRefreshToken);
  if (!session) {
    throw createHttpError(401, 'Session not found or expired.');
  }

  const user = await User.findById(session.userId);
  if (!user) {
    throw createHttpError(401, 'User not found for refresh token.');
  }

  const { accessToken, refreshToken } = generateAuthTokens(user);
  await createSession(user, accessToken, refreshToken);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  res.json({
    status: 200,
    message: "Successfully refreshed a session!",
    data: { accessToken }
  });
});

export const sendResetEmail = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { error } = requestResetEmailSchema.validate(req.body);
  if (error) {
    throw createHttpError(400, error.message);
  }

  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const resetToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '5m' }); // 5 minutes expiry
  const resetURL = `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`;

  const resetPasswordTemplatePath = path.join(TEMPLATES_DIR, 'reset-password-email.html');
  const templateSource = (await fs.readFile(resetPasswordTemplatePath)).toString();
  const template = handlebars.compile(templateSource);
  const html = template({
    link: resetURL,
    year: new Date().getFullYear(),
    timestamp: new Date().toISOString(),
    requestIp: req.ip
  });

  console.log('Sending reset password email to:', email);
  console.log('Reset URL:', resetURL);

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
  });

  res.status(200).json({
    status: 200,
    message: 'Reset password email has been successfully sent.',
    data: {}
  });
});

export const handleResetPassword = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('Reset password request received:', req.body);

  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    console.error('Validation error:', error);
    throw createHttpError(400, error.message);
  }

  const { token, password } = req.body;
  let decoded: { email: string };

  try {
    console.log('Verifying token...');
    decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    console.log('Token decoded:', decoded);
  } catch (err) {
    console.error('Token verification error:', err);
    if (err instanceof jwt.TokenExpiredError) {
      throw createHttpError(401, 'Token is expired.');
    }
    throw createHttpError(401, 'Token is invalid.');
  }

  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    console.error('User not found:', decoded.email);
    throw createHttpError(404, 'User not found!');
  }

  console.log('Updating password for user:', decoded.email);
  user.password = await hashPassword(password);
  await user.save();

  // Delete all active sessions for this user
  await Session.deleteMany({ userId: user._id });
  console.log('Password reset successful for user:', decoded.email);

  res.status(200).json({
    status: 200,
    message: 'Password has been successfully reset.',
    data: {}
  });
});

export const getGoogleOAuthUrlController = async (req: Request, res: Response) => {
  const url = generateAuthUrl();
  res.json({
    status: 200,
    message: 'Successfully get Google OAuth url!',
    data: {
      url,
    },
  });
};


export const loginWithGoogleController = async (req: CustomRequest, res: Response) => {
  const session = await loginOrSignupWithGoogle(req.body.code);
  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully logged in via Google OAuth!',
    data: {
      accessToken: session.accessToken,
    },
  });
};
