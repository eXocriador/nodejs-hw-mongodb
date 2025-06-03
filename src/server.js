import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { getEnvVar } from './utils/getEnvVar.js';
import welcomeRoute from './routers/welcomeRoute.js';
import contactsRouter from './routers/contacts.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './middlewares/logger.js';

dotenv.config();

const PORT = Number(getEnvVar('PORT', '3000'));

export const serverSetup = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(logger);
  app.use('/', welcomeRoute);

  app.use('/contacts', contactsRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};
