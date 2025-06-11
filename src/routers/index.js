import { Router } from 'express';
import welcomeRoute from './welcomeRoute.js';
import contactsRouter from './contacts.js';
import authRouter from './auth.js';
import healthRouter from './health.js';

const router = Router();

router.use('/', welcomeRoute);
router.use('/auth', authRouter);
router.use('/contacts', contactsRouter);
router.use('/health', healthRouter);

export default router;
