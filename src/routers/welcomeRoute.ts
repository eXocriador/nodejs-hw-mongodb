import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Contacts-app API!',
    docs: '/api-docs',
    routes: [
      '/',
      '/contacts',
      '/auth',
      '/health',
    ],
  });
});

export default router;
