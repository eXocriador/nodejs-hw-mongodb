import { Request, Response, NextFunction, RequestHandler } from 'express';
import createHttpError from 'http-errors';
import { ObjectSchema } from 'joi';

export const validateBody = (schema: ObjectSchema): RequestHandler => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err: any) {
    const messages = err.details.map(({ message }: { message: string }) => message).join(', ');
    next(createHttpError(400, messages));
  }
};
