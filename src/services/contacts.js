import { Contacts } from '../db/models/contact.js';
import { calculatePaginationData } from '../utils/filters/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/contacts.js';
import createHttpError from 'http-errors';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filters = {},
  userId,
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;
  const contactsQuery = Contacts.find({ ...filters, userId });
  const contactsCount = await Contacts.countDocuments({ ...filters, userId });
  const contacts = await contactsQuery
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder })
    .exec();
  const paginationData = calculatePaginationData(contactsCount, perPage, page);

  return {
    data: contacts,
    ...paginationData,
  };
};

export const getContactById = async (contactId, userId) => {
  const contact = await Contacts.findOne({ _id: contactId, userId });
  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  return contact;
};

export const createContact = async (contactData, userId) => {
  return await Contacts.create({ ...contactData, userId });
};

export const deleteContact = async (contactId, userId) => {
  const contact = await Contacts.findOneAndDelete({ _id: contactId, userId });
  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  return contact;
};

export const updateContact = async (
  contactId,
  payload,
  userId,
  options = {},
) => {
  const { upsert = false } = options;

  const updatedContact = await Contacts.findOneAndUpdate(
    { _id: contactId, userId },
    payload,
    {
      upsert,
      new: true,
    },
  );

  if (!updatedContact) {
    throw createHttpError(404, 'Contact not found');
  }

  return updatedContact;
};
