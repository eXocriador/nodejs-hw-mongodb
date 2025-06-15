import pinoHttp from 'pino-http';
import { getEnvVar } from '../utils/getEnvVar';

const isDevelopment = getEnvVar('NODE_ENV') === 'development';

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
  customLogLevel: (req, res, error) => {
    if (res.statusCode >= 400 && !error) return 'warn';
    if (error) return 'error';
    if (res.statusCode >= 300) return 'silent';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, error) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${error.message}`;
  },
});
