import createHttpError from 'http-errors';

export const handeSaveError = (error, doc, next) => {
  console.error('MongoDB error:', error);

  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `Duplicate value for ${field}: "${error.keyValue[field]}"`;
    return next(createHttpError(409, message));
  }

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors)
      .map((err) => err.message)
      .join(', ');
    return next(createHttpError(400, messages));
  }

  next(error);
};

export const setUpdateSettings = function (next) {
  this.options.new = true;
  this.options.runValidators = true;
  next();
};
