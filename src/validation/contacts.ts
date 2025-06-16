import Joi from 'joi';
import { ContactRequest, UpdateContactRequest } from '../types/models';

export const contactSchema = Joi.object<ContactRequest>({
  name: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().min(3).max(20).required(),
  favorite: Joi.boolean(),
});

export const updateContactSchema = Joi.object<UpdateContactRequest>({
  name: Joi.string().min(3).max(20),
  email: Joi.string().email(),
  phoneNumber: Joi.string().min(3).max(20),
  favorite: Joi.boolean(),
}).min(1);
