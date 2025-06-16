import Joi from 'joi';
import { ContactRequest, UpdateContactRequest } from '../types/models';
import { typeList } from '../constants/contacts';

export const contactSchema = Joi.object<ContactRequest>({
  name: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().min(3).max(20).required(),
  isFavourite: Joi.boolean(),
  contactType: Joi.string().valid(...typeList).required(),
});

export const updateContactSchema = Joi.object<UpdateContactRequest>({
  name: Joi.string().min(3).max(20),
  email: Joi.string().email(),
  phoneNumber: Joi.string().min(3).max(20),
  isFavourite: Joi.boolean(),
  contactType: Joi.string().valid(...typeList),
}).min(1);
