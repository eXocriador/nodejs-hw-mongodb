import createHttpError from 'http-errors';
import { CallbackError, Document } from 'mongoose';

// Інтерфейс для MongoServerError
interface MongoServerError extends Error {
  code?: number;
  keyValue?: { [key: string]: any };
  name: 'MongoServerError';
}

// Інтерфейс для ValidationError (якщо Joi не перехоплює раніше)
interface MongooseValidationError extends Error {
  name: 'ValidationError';
  errors?: {
    [key: string]: {
      message: string;
      kind: string;
      path: string;
      value: any;
      reason?: any;
    };
  };
}

export const handeSaveError = (error: CallbackError, doc: Document, next: (err?: any) => void): void => {
  const mongoError = error as MongoServerError;
  if (mongoError.name === 'MongoServerError' && mongoError.code === 11000) {
    const field = Object.keys(mongoError.keyValue || {})[0];
    const message = `Duplicate value for ${field}: "${mongoError.keyValue?.[field]}"`;
    return next(createHttpError(409, message));
  }

  const validationError = error as MongooseValidationError;
  if (validationError.name === 'ValidationError') {
    const messages = Object.values(validationError.errors || {})
      .map((err: any) => err.message)
      .join(', ');
    return next(createHttpError(400, messages));
  }

  next(error);
};

export const setUpdateSettings = function (this: any, next: () => void): void {
  this.options.new = true;
  this.options.runValidators = true;
  next();
};
