import pinoHttp from 'pino-http';
import { getEnvVar } from '../utils/getEnvVar';
import { Request, Response } from 'express';

const isDevelopment: boolean = getEnvVar('NODE_ENV') === 'development';

export const logger = pinoHttp({
  level: isDevelopment ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:standard',
    },
  },
  customLogLevel: (req: Request, res: Response, error?: Error): string => {
    if (res.statusCode >= 400 && !error) return 'warn';
    if (error) return 'error';
    if (res.statusCode >= 300) return 'silent';
    return 'info';
  },
  customSuccessMessage: (req: Request, res: Response): string => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req: Request, res: Response, error: Error): string => {
    return `${req.method} ${req.url} ${res.statusCode} - ${error.message}`;
  },
});
