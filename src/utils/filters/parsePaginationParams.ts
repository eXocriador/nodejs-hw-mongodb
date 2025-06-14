interface Query {
  page?: string;
  perPage?: string;
}

interface PaginationParams {
  page: number;
  perPage: number;
}

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  const parsed = parseInt(value || '', 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

export const parsePaginationParams = (query: Query): PaginationParams => {
  const { page, perPage } = query;

  return {
    page: parseNumber(page, 1),
    perPage: parseNumber(perPage, 10),
  };
};
