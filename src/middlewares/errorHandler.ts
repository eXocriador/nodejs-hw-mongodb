import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/index';
import { getEnvVar } from '../utils/getEnvVar';

const isDevelopment: boolean = getEnvVar('NODE_ENV') === 'development';

export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status: number = err.status || 500;
  const message: string = err.message || 'Internal Server Error';

  // Log error details
  console.error('Error:', {
    status,
    message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Send response
  res.status(status).json({
    message: isDevelopment ? message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
};
