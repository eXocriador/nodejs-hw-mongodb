import Joi from 'joi';
import { emailRegex } from '../constants/auth.js';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required().trim(),
  email: Joi.string().pattern(emailRegex).required().trim(),
  password: Joi.string().min(6).required().trim(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().pattern(emailRegex).required().trim(),
  password: Joi.string().required().trim(),
});
