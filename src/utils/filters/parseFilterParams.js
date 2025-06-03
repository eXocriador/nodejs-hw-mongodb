import { typeList } from '../../constants/contacts.js';

const parseContactType = (contactType) => {
  if (typeof contactType !== 'string') return undefined;
  const cleaned = contactType.trim();
  return typeList.includes(cleaned) ? cleaned : undefined;
};

const parsePhoneNumber = (phoneNumber) => {
  if (typeof phoneNumber !== 'string') return undefined;
  const cleaned = phoneNumber.trim();
  const regex = /^\+?\d{10,15}$/;
  return regex.test(cleaned) ? cleaned : undefined;
};

const parseIsFavourite = (isFavourite) => {
  if (typeof isFavourite !== 'string') return undefined;
  const val = isFavourite.trim().toLowerCase();
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
};

const parseName = (name) => {
  if (typeof name !== 'string') return undefined;
  const cleaned = name.trim();
  return cleaned.length > 0 ? new RegExp(cleaned, 'i') : undefined;
};

export const parseFilterParams = (query) => {
  const filters = {};

  const type = parseContactType(query.contactType);
  if (type) filters.contactType = type;

  const fav = parseIsFavourite(query.isFavourite);
  if (fav !== undefined) filters.isFavourite = fav;

  const phone = parsePhoneNumber(query.phoneNumber);
  if (phone) filters.phoneNumber = phone;

  const name = parseName(query.name);
  if (name) filters.name = name;

  return filters;
};
