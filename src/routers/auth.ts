import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.ts';
import { validateBody } from '../middlewares/validateBody.ts';
import { authSchema, loginSchema, loginWithGoogleOAuthSchema, requestResetEmailSchema, resetPasswordSchema } from '../validation/auth.ts';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refresh,
  sendResetEmail,
  handleResetPassword,
  getGoogleOAuthUrlController,
  loginWithGoogleController
} from '../controllers/auth.ts';
import { ctrlWrapper } from '../utils/ctrlWrapper.ts';

const router = Router();

// Public routes
router.post('/register', validateBody(authSchema), ctrlWrapper(register));
router.post('/login', validateBody(loginSchema), ctrlWrapper(login));
router.post('/refresh', ctrlWrapper(refresh));
router.post('/forgot-password', validateBody(requestResetEmailSchema), ctrlWrapper(sendResetEmail));
router.post('/reset-password', validateBody(resetPasswordSchema), ctrlWrapper(handleResetPassword));

// Google OAuth routes
router.get('/google', ctrlWrapper(getGoogleOAuthUrlController));
router.post('/google/callback', validateBody(loginWithGoogleOAuthSchema), ctrlWrapper(loginWithGoogleController));

// Protected routes
router.post('/logout', authenticate, ctrlWrapper(logout));
router.get('/current', authenticate, ctrlWrapper(getCurrentUser));

export default router;
