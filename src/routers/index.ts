import { Router } from 'express';
import welcomeRoute from './welcomeRoute.ts';
import contactsRouter from './contacts.ts';
import authRouter from './auth.ts';
import healthRouter from './health.ts';

const router = Router();

router.use('/', welcomeRoute);
router.use('/contacts', contactsRouter);
router.use('/auth', authRouter);
router.use('/health', healthRouter);

export default router;
