// src/utils/sendResponse.js

export const sendResponse = (
  res,
  { status = 200, message = 'Success', data = null },
) => {
  res.status(status).json({
    status,
    message,
    data,
  });
};
