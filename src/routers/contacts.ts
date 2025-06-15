import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validateBody } from '../middlewares/validateBody';
import { contactSchema, updateContactSchema } from '../validation/contacts';
import { upload } from '../middlewares/upload';
import { isValidId } from '../middlewares/isValidId';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contacts';

const router = Router();

router.use(authenticate);

router.get('/', getContacts);
router.get('/:contactId', isValidId, getContactById);
router.post('/', upload.single('photo'), validateBody(contactSchema), createContact);
router.patch('/:contactId', isValidId, upload.single('photo'), validateBody(updateContactSchema), updateContact);
router.delete('/:contactId', isValidId, deleteContact);

export default router;
