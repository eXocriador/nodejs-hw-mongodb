import path from 'node:path';
import express, { Express, RequestHandler, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json';
import { getEnvVar } from './utils/getEnvVar';
import router from './routers/index';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './middlewares/logger';
import { startLogs } from './utils/startLogs';
import {
  corsOptions,
  rateLimiter,
  helmetConfig,
  requestSizeLimiter,
  securityHeaders
} from './middlewares/security';


dotenv.config();
const PORT: number = Number(getEnvVar('PORT', '3000'));
const docsPath = path.join(process.cwd(), 'docs');


export const serverSetup = (): Express => {
  const app: Express = express();
  app.use(helmetConfig);
  app.use(cors(corsOptions));
  app.use(rateLimiter);
  app.use(requestSizeLimiter);
  app.use(securityHeaders);
  app.use(compression() as RequestHandler);
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
  app.use(logger);
  app.use(router);
  app.get('/api-docs', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'docs', 'api.html'));
  });
  app.use(errorHandler);
  app.listen(PORT, startLogs);
  return app;
};
