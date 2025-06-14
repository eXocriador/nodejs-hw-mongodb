import Joi from 'joi';
import { ContactRequest, UpdateContactRequest } from '../types/models.ts';
import { typeList } from '../constants/contacts.ts';

const photoSchema = Joi.object({
  secure_url: Joi.string().required(),
  public_id: Joi.string().required(),
});

export const contactSchema = Joi.object<ContactRequest>({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
  contactType: Joi.string().valid(...typeList),
  photo: photoSchema,
});

export const updateContactSchema = Joi.object<UpdateContactRequest>({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  favorite: Joi.boolean(),
  contactType: Joi.string().valid(...typeList),
  photo: photoSchema,
}).min(1);
