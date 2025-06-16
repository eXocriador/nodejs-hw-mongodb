import { SORT_ORDER } from '../../constants/contacts';

type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

type Query = {
  sortOrder?: string;
  sortBy?: string;
};

type SortParams = {
  sortOrder: SortOrder;
  sortBy: string;
};

const parseSortOrder = (sortOrder?: string): SortOrder => {
  const isKnownOrder = [SORT_ORDER.ASC, SORT_ORDER.DESC].includes(sortOrder as SortOrder);
  if (isKnownOrder) return sortOrder as SortOrder;
  return SORT_ORDER.ASC;
};

const parseSortBy = (sortBy?: string): string => {
  const keysOfContact = [
    '_id',
    'name',
    'phoneNumber',
    'email',
    'isFavourite',
    'createdAt',
    'updatedAt',
  ];

  if (sortBy && keysOfContact.includes(sortBy)) {
    return sortBy;
  }

  return '_id';
};

export const parseSortParams = (query: Query): SortParams => {
  const { sortOrder, sortBy } = query;

  const parsedSortOrder = parseSortOrder(sortOrder);
  const parsedSortBy = parseSortBy(sortBy);

  return {
    sortOrder: parsedSortOrder,
    sortBy: parsedSortBy,
  };
};
