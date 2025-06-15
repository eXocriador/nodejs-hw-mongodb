import createHttpError from 'http-errors';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';

import { IUser } from '../types/models';
import { CustomRequest } from '../types/index';
import { hashPassword, comparePassword } from '../services/auth';
import { authSchema, loginSchema, requestResetEmailSchema, resetPasswordSchema, loginWithGoogleOAuthSchema, updateProfileSchema } from '../validation/auth';
import User from '../db/models/user';
import Session from '../db/models/session';
import { generateAuthTokens, createSession, deleteSession, findSessionByRefreshToken, setupSession } from '../services/session';
import { ctrlWrapper } from '../utils/ctrlWrapper';
import { getEnvVar } from '../utils/getEnvVar';
import { sendEmail } from '../services/email';
import { TEMPLATES_DIR } from '../constants/index';
import { generateAuthUrl } from '../utils/googleOAuth2';
import { loginOrSignupWithGoogle } from '../services/auth';


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

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const { password: _, ...userWithoutPassword } = user.toObject();

  res.status(201).json({
    status: 201,
    message: "Successfully registered a user!",
    data: userWithoutPassword
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
    message: 'Password reset email sent successfully!',
    data: {}
  });
});

export const handleResetPassword = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw createHttpError(400, error.message);
  }

  const { token, password } = req.body;

  if (!token) {
    throw createHttpError(400, 'Reset token is missing');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      throw createHttpError(404, 'User not found for this token');
    }

    user.password = await hashPassword(password);
    await user.save();

    // Delete all user sessions after password reset
    await Session.deleteMany({ userId: user._id });

    res.status(200).json({
      status: 200,
      message: 'Password has been reset successfully!',
      data: {}
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw createHttpError(400, 'Invalid or expired token');
    }
    throw createHttpError(500, 'Failed to reset password');
  }
});

export const getGoogleOAuthUrlController = async (
  _req: Request,
  res: Response,
) => {
  console.log("Attempting to generate Google OAuth URL...");
  const url = generateAuthUrl();
  console.log("Generated Google OAuth URL:", url);
  res.json({ url });
};

export const loginWithGoogleController = async (
  req: CustomRequest,
  res: Response,
) => {
  const { error } = loginWithGoogleOAuthSchema.validate(req.body);
  if (error) {
    throw createHttpError(400, error.message);
  }

  const { code } = req.body;

  const { user, accessToken, refreshToken } = await loginOrSignupWithGoogle(code);

  await setupSession(user, accessToken, refreshToken, res);

  res.status(200).json({
    status: 200,
    message: 'Successfully logged in with Google!',
    data: { user, accessToken, refreshToken },
  });
};

export const updateProfileController = ctrlWrapper(async (
  req: CustomRequest,
  res: Response,
  _next: NextFunction
) => {
  const { error } = updateProfileSchema.validate(req.body);
  if (error) {
    throw createHttpError(400, error.message);
  }

  const user = req.user as IUser;

  const { name, email, currentPassword, newPassword } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;

  if (newPassword && !currentPassword) {
    throw createHttpError(400, 'Current password is required to set a new password');
  }

  if (newPassword && currentPassword) {
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Current password is wrong');
    }
    user.password = await hashPassword(newPassword);
  }

  await user.save();

  res.status(200).json({
    status: 200,
    message: 'Profile updated successfully!',
    data: user,
  });
});
