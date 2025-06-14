import Joi from 'joi';
import { AuthRequest, RequestResetEmailRequest, ResetPasswordRequest, LoginWithGoogleOAuthRequest } from '../types/models.ts';
import { emailRegex } from '../constants/auth.ts';

export const authSchema = Joi.object<AuthRequest>({
  name: Joi.string().required(),
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object<AuthRequest>({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().min(6).required(),
});

export const requestResetEmailSchema = Joi.object<RequestResetEmailRequest>({
  email: Joi.string().pattern(emailRegex).required(),
});

export const resetPasswordSchema = Joi.object<ResetPasswordRequest>({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

export const loginWithGoogleOAuthSchema = Joi.object<LoginWithGoogleOAuthRequest>({
  code: Joi.string().required(),
  state: Joi.string(),
  error: Joi.string(),
  error_description: Joi.string(),
});
