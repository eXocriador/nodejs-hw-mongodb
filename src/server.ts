import path from 'node:path';
import express, { Express, RequestHandler } from 'express'; // Спростив імпорти для ясності
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUiDist from 'swagger-ui-dist'; // <--- 1. Імпортуйте новий пакет
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
  securityHeaders,
} from './middlewares/security';

dotenv.config();
const PORT: number = Number(getEnvVar('PORT', '3000'));

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
  const swaggerUiPath = swaggerUiDist.getAbsoluteFSPath();
  app.use('/api-docs', express.static(swaggerUiPath));
  app.get('/api-docs/swagger-initializer.js', (req, res) => {
    const initializerPath = path.join(swaggerUiPath, 'swagger-initializer.js');
    const originalInitializer = require('fs').readFileSync(initializerPath, 'utf8');
    const modifiedInitializer = originalInitializer.replace(
      'https://petstore.swagger.io/v2/swagger.json',
      '/swagger.json'
    );
    res.type('application/javascript').send(modifiedInitializer);
  });
  app.get('/swagger.json', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'docs', 'swagger.json'));
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  app.listen(PORT, startLogs);
  return app;
};
