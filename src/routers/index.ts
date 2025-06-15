import { Router } from 'express';
import welcomeRoute from './welcomeRoute';
import contactsRouter from './contacts';
import authRouter from './auth';
import healthRouter from './health';

const router = Router();

router.use('/', welcomeRoute);
router.use('/contacts', contactsRouter);
router.use('/auth', authRouter);
router.use('/health', healthRouter);

export default router;
