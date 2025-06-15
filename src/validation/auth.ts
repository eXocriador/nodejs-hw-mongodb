import Joi from 'joi';
import { AuthRequest, RequestResetEmailRequest, ResetPasswordRequest, LoginWithGoogleOAuthRequest, UpdateProfileRequest } from '../types/models';
import { emailRegex } from '../constants/auth';

// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 100 characters',
  });

export const authSchema = Joi.object<AuthRequest>({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().pattern(emailRegex).required(),
  password: passwordSchema.required(),
});

export const loginSchema = Joi.object<AuthRequest>({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().required(),
});

export const requestResetEmailSchema = Joi.object<RequestResetEmailRequest>({
  email: Joi.string().pattern(emailRegex).required(),
});

export const resetPasswordSchema = Joi.object<ResetPasswordRequest>({
  token: Joi.string().required(),
  password: passwordSchema.required(),
});

export const loginWithGoogleOAuthSchema = Joi.object<LoginWithGoogleOAuthRequest>({
  code: Joi.string().required(),
});

export const updateProfileSchema = Joi.object<UpdateProfileRequest>({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().pattern(emailRegex).optional(),
  currentPassword: Joi.string().required().when('newPassword', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  newPassword: passwordSchema.optional(),
}).custom((obj, helpers) => {
  if (obj.newPassword && !obj.currentPassword) {
    return helpers.error('any.invalid', { message: 'Current password is required to set a new password' });
  }
  if (!obj.name && !obj.email && !obj.newPassword) {
    return helpers.error('any.invalid', { message: 'At least one field must be provided' });
  }
  return obj;
});
