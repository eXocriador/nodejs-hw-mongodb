import { Contacts } from '../db/models/contact.js';

export const getAllContacts = async () => {
  const contacts = await Contacts.find();
  return contacts;
};

export const getContactById = async (contactId) => {
  const contact = await Contacts.findById(contactId);
  return contact;
};

export const createContact = async (contactData) => {
  const newContact = await Contacts.create(contactData);
  return newContact;
};

export const deleteContact = async (contactId) => {
  const deletedContact = await Contacts.findByIdAndDelete(contactId);
  return deletedContact;
};

export const updateContact = async (contactId, payload, options = {}) => {
  const { upsert = false } = options;
  const rawResult = await Contacts.findByIdAndUpdate(contactId, payload, {
    new: true,
    upsert,
    includeResultMetadata: true,
  });
  if (!rawResult || !rawResult.value) {
    return null;
  }
  return {
    data: rawResult.value,
    isNew: Boolean(rawResult.lastErrorObject.upserted),
  };
};
