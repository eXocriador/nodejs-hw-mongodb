import type { Response } from 'express';

interface SendResponseOptions {
  status?: number;
  message?: string;
  data?: any;
}

export function sendResponse(res: Response, options: SendResponseOptions): void {
  const { status = 200, message = 'Success', data = null } = options;
  res.status(status).json({ message, data });
}
