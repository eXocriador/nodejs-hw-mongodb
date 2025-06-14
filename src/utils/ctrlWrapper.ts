import { Request, Response, NextFunction, RequestHandler } from 'express';

export const ctrlWrapper = (ctrl: Function) => {
  return async (req: any, res: any, next: any) => {
    try {
      await ctrl(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
