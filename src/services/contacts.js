import { Contacts } from '../db/models/contact.js';

export const getAllContacts = async () => {
  return await Contacts.find();
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
    new: true,
    upsert,
  });

  return updatedContact;
};
