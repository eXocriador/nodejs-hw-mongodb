import express, { Express, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { getEnvVar } from './utils/getEnvVar.ts';
import router from './routers/index.ts';
import { notFoundHandler } from './middlewares/notFoundHandler.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { logger } from './middlewares/logger.ts';
import { startLogs } from './utils/startLogs.ts';

dotenv.config();
const PORT = Number(getEnvVar('PORT', '3000'));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

export const serverSetup = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Performance middleware
  app.use(compression() as unknown as RequestHandler);
  app.use(limiter)

  // Body parsing middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Logging and routing
  app.use(logger);
  app.use(router);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, startLogs);

  return app;
};
