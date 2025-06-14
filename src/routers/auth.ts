import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.ts';
import { validateBody } from '../middlewares/validateBody.ts';
import { authSchema, loginSchema, requestResetEmailSchema, resetPasswordSchema } from '../validation/auth.ts';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refresh,
  sendResetEmail,
  handleResetPassword
} from '../controllers/auth.ts';

const router = Router();

// Public routes
router.post('/register', validateBody(authSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/send-reset-email', validateBody(requestResetEmailSchema), sendResetEmail);
router.post('/reset-pwd', validateBody(resetPasswordSchema), handleResetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/current', authenticate, getCurrentUser);

export default router;
