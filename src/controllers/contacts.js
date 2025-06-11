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

const checkUserAuth = (req) => {
  if (!req.user) {
    throw createHttpError(
      401,
      'Authentication required. Please log in to access this resource.',
    );
  }
};

export const getContactsController = async (req, res) => {
  checkUserAuth(req);

  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filters = parseFilterParams(req.query);
  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filters,
    userId: req.user._id,
  });

  if (!contacts || contacts.data.length === 0) {
    throw createHttpError(404, 'No contacts found for the current user');
  }

  sendResponse(res, {
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  checkUserAuth(req);

  const { contactId } = req.params;
  const contact = await getContactById(contactId, req.user._id);

  if (!contact) {
    throw createHttpError(
      404,
      `Contact with id ${contactId} not found for the current user`,
    );
  }

  sendResponse(res, {
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  checkUserAuth(req);

  const contact = await createContact(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const deleteContactController = async (req, res) => {
  checkUserAuth(req);

  const { contactId } = req.params;
  const contact = await deleteContact(contactId, req.user._id);

  if (!contact) {
    throw createHttpError(404, 'Contact not found for the current user');
  }

  res.status(204).send();
};

export const upsertContactController = async (req, res) => {
  checkUserAuth(req);

  const { contactId } = req.params;
  const contactBefore = await getContactById(contactId, req.user._id);
  const contact = await updateContact(contactId, req.body, req.user._id, {
    upsert: true,
  });

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
  checkUserAuth(req);

  const { contactId } = req.params;
  const updatedContact = await updateContact(contactId, req.body, req.user._id);

  if (!updatedContact) {
    throw createHttpError(
      404,
      `Contact with id ${contactId} not found for the current user`,
    );
  }

  sendResponse(res, {
    message: `Successfully patched contact with id ${contactId}!`,
    data: updatedContact,
  });
};
