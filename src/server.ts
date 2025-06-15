import express, { Express, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
const PORT = Number(getEnvVar('PORT', '3000'));
const NODE_ENV = getEnvVar('NODE_ENV', 'development');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 1000 : 100, // More requests allowed in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for development environment
  skip: (req) => NODE_ENV === 'development' && req.path.startsWith('/auth/google'),
});

export const serverSetup = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmetConfig);
  app.use(corsOptions);
  app.use(rateLimiter);
  app.use(requestSizeLimiter);
  app.use(securityHeaders);

  // Performance middleware
  app.use(compression() as unknown as RequestHandler);

  // Body parsing middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Logging and routing
  app.use(logger);
  app.use(router);

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, startLogs);

  return app;
};
