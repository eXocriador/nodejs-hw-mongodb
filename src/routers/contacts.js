import { Router } from 'express';
import {
  getContactsController,
  getContactByIdController,
  createContactController,
  deleteContactController,
  upsertContactController,
  patchContactController,
} from '../controllers/contacts.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const contactsRouter = Router();

contactsRouter.get('/', ctrlWrapper(getContactsController));
contactsRouter.get('/:contactId', ctrlWrapper(getContactByIdController));
contactsRouter.post('/', ctrlWrapper(createContactController));
contactsRouter.delete('/:contactId', ctrlWrapper(deleteContactController));
contactsRouter.put('/:contactId', ctrlWrapper(upsertContactController));
contactsRouter.patch('/:contactId', ctrlWrapper(patchContactController));

export default contactsRouter;
