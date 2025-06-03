import { Contacts } from '../db/models/contact.js';
import { calculatePaginationData } from '../utils/filters/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/contacts.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filters = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;
  const contactsQuery = Contacts.find(filters);
  const contactsCount = await Contacts.countDocuments(filters);
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

export const getContactById = async (contactId) => {
  return await Contacts.findById(contactId);
};

export const createContact = async (contactData) => {
  return await Contacts.create(contactData);
};

export const deleteContact = async (contactId) => {
  return await Contacts.findByIdAndDelete(contactId);
};

export const updateContact = async (contactId, payload, options = {}) => {
  const { upsert = false } = options;

  const updatedContact = await Contacts.findByIdAndUpdate(contactId, payload, {
    upsert,
    new: true,
  });

  return updatedContact;
};
