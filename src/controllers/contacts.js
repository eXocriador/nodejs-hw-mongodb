import {
  getAllContacts,
  getContactById,
  createContact,
  deleteContact,
  updateContact,
} from '../services/contacts.js';
import { sendResponse } from '../utils/sendResponse.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/filters/parsePaginationParams.js';
import { parseSortParams } from '../utils/filters/parseSortParams.js';
import { parseFilterParams } from '../utils/filters/parseFilterParams.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filters = parseFilterParams(req.query);
  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filters,
  });

  if (!contacts || contacts.data.length === 0) {
    throw createHttpError(404, 'Contacts not found!');
  }

  sendResponse(res, {
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  const { contactId } = req.params;
  const contact = await getContactById(contactId);

  if (!contact) {
    throw createHttpError(404, `Contact with id ${contactId} not found!`);
  }

  sendResponse(res, {
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  const contact = await createContact(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const deleteContactController = async (req, res) => {
  const { contactId } = req.params;
  const contact = await deleteContact(contactId);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).send();
};

export const upsertContactController = async (req, res) => {
  const { contactId } = req.params;
  const contactBefore = await getContactById(contactId);
  const contact = await updateContact(contactId, req.body, { upsert: true });

  const isNew = !contactBefore;
  const status = isNew ? 201 : 200;

  sendResponse(res, {
    statusCode: status,
    message: `Successfully ${
      isNew ? 'created' : 'updated'
    } contact with id ${contactId}!`,
    data: contact,
  });
};

export const patchContactController = async (req, res) => {
  const { contactId } = req.params;
  const updatedContact = await updateContact(contactId, req.body);

  if (!updatedContact) {
    throw createHttpError(404, `Contact with id ${contactId} not found!`);
  }

  sendResponse(res, {
    message: `Successfully patched contact with id ${contactId}!`,
    data: updatedContact,
  });
};
