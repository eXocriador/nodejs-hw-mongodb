const parseNumber = (value, defaultValue) => {
  const parsed = parseInt(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

export const parsePaginationParams = (query) => {
  const { page, perPage } = query;

  return {
    page: parseNumber(page, 1),
    perPage: parseNumber(perPage, 10),
  };
};
