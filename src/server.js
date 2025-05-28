import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';

import { getEnvVar } from './utils/getEnvVar.js';
import contactsRouter from './routers/contacts.js';
import './routers/contacts.js';
dotenv.config();

const PORT = Number(getEnvVar('PORT', '3000'));

export const serverSetup = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.use('/contacts', contactsRouter);

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      message: 'Something went wrong',
      error: err.message,
    });
    next(err);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
