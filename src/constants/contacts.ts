export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MIN_LIMIT = 1;
export const MIN_PAGE = 1;

export const typeList = ['personal', 'work', 'other'] as const;
export type ContactType = (typeof typeList)[number];

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
