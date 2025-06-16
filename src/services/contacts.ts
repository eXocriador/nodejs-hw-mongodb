import { IContact, PaginationQuery, ContactResponse } from '../types/models';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT, MIN_LIMIT, MIN_PAGE } from '../constants/contacts';

export const getPaginationParams = (query: PaginationQuery) => {
  const page = Math.max(MIN_PAGE, parseInt(query.page || String(DEFAULT_PAGE)));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(MIN_LIMIT, parseInt(query.limit || String(DEFAULT_LIMIT)))
  );
  const skip = (page - 1) * limit;
  const favorite = query.favorite === 'true';

  return { page, limit, skip, favorite };
};

export const formatContactResponse = (contact: IContact): ContactResponse => ({
  id: contact._id,
  name: contact.name,
  email: contact.email,
  phoneNumber: contact.phoneNumber,
  favorite: contact.favorite,
  owner: contact.owner,
});
