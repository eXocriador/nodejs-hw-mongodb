import createHttpError from 'http-errors';

export const validateBody = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err) {
    const messages = err.details.map(({ message }) => message).join(', ');
    const error = createHttpError(400, messages);
    next(error);
  }
};
