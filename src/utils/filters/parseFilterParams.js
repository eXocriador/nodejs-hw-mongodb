// src/utils//filters/parseFilterParams.js

import { typeList } from '../../constants/contacts.js';

const parseContactType = (contactType) => {
  if (typeof contactType !== 'string') return;
  return typeList.includes(contactType) ? contactType : undefined;
};

const parsePhoneNumber = (phoneNumber) => {
  if (typeof phoneNumber !== 'string') return;
  const cleaned = phoneNumber.trim();
  const regex = /^\+?\d{10,15}$/;
  return regex.test(cleaned) ? cleaned : undefined;
};

const parseIsFavourite = (isFavourite) => {
  if (typeof isFavourite !== 'string') return;
  const val = isFavourite.toLowerCase();
  if (val === 'true') return true;
  if (val === 'false') return false;
  return;
};

export const parseFilterParams = (query) => {
  const { contactType, isFavourite, phoneNumber } = query;

  return {
    ...(parseContactType(contactType) && {
      contactType: parseContactType(contactType),
    }),
    ...(parseIsFavourite(isFavourite) !== undefined && {
      isFavourite: parseIsFavourite(isFavourite),
    }),
    ...(parsePhoneNumber(phoneNumber) && {
      phoneNumber: parsePhoneNumber(phoneNumber),
    }),
  };
};
