import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.ts';
import { validateBody } from '../middlewares/validateBody.ts';
import { contactSchema, updateContactSchema } from '../validation/contacts.ts';
import { upload } from '../middlewares/upload.ts';
import { isValidId } from '../middlewares/isValidId.ts';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  updateStatusContact
} from '../controllers/contacts.ts';

const router = Router();

router.use(authenticate);

router.get('/', getContacts);
router.get('/:contactId', isValidId, getContactById);
router.post('/', upload.single('photo'), validateBody(contactSchema), createContact);
router.patch('/:contactId', isValidId, upload.single('photo'), validateBody(updateContactSchema), updateContact);
router.delete('/:contactId', isValidId, deleteContact);
router.patch('/:contactId/favorite', isValidId, validateBody(updateContactSchema), updateStatusContact);

export default router;
