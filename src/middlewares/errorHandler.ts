import type { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/index.ts';
import { getEnvVar } from '../utils/getEnvVar.ts';

const isDevelopment = getEnvVar('NODE_ENV') === 'development';

export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details
  console.error('Error:', {
    status,
    message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Send response
  res.status(status).json({
    message,
    ...(isDevelopment && { stack: err.stack })
  });
};
