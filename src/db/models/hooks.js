export const handeSaveError = (error, doc, next) => {
  console.log(error);
  next(error);
};

export const setUpdateSettings = function (next) {
  this.options.new = true;
  this.options.runValidators = true;
  next();
};
