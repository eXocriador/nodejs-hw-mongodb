import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validateBody } from '../middlewares/validateBody';
import { authSchema, loginSchema, loginWithGoogleOAuthSchema, requestResetEmailSchema, resetPasswordSchema, updateProfileSchema } from '../validation/auth';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refresh,
  sendResetEmail,
  handleResetPassword,
  getGoogleOAuthUrlController,
  loginWithGoogleController,
  updateProfileController
} from '../controllers/auth';
import { ctrlWrapper } from '../utils/ctrlWrapper';

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
router.put('/profile', authenticate, validateBody(updateProfileSchema), ctrlWrapper(updateProfileController));

export default router;
