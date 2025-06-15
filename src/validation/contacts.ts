import Joi from 'joi';
import { ContactRequest, UpdateContactRequest } from '../types/models';
import { typeList } from '../constants/contacts';

const photoSchema = Joi.object({
  secure_url: Joi.string().required(),
  public_id: Joi.string().required(),
});

export const contactSchema = Joi.object<ContactRequest>({
  name: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(3).max(20).required(),
  favorite: Joi.boolean(),
  contactType: Joi.string().valid(...typeList),
  photo: photoSchema,
});

export const updateContactSchema = Joi.object<UpdateContactRequest>({
  name: Joi.string().min(3).max(20),
  email: Joi.string().email(),
  phone: Joi.string().min(3).max(20),
  favorite: Joi.boolean(),
  contactType: Joi.string().valid(...typeList),
  photo: photoSchema,
}).min(1);
