import { Response, NextFunction } from 'express';
import { IUser } from '../types/models';
import { CustomRequest } from '../types/index';
import { formatContactResponse } from '../services/contacts';
import { Contacts } from '../db/models/contact';
import createHttpError from 'http-errors';
import { uploadImage } from '../services/cloudinary';
import { parseSortParams } from '../utils/filters/parseSortParams';
import { parseFilterParams } from '../utils/filters/parseFilterParams';

import { parsePaginationParams } from '../utils/filters/parsePaginationParams';

export const getContacts = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {

    const { page, perPage } = parsePaginationParams(req.query);
    const { sortBy, sortOrder } = parseSortParams(req.query);
    const filters = parseFilterParams(req.query);

    const skip = (page - 1) * perPage;

    const query = {
      owner: req.user?.id,
      ...filters,
    };

    const [contacts, total] = await Promise.all([
      Contacts.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(perPage),
      Contacts.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      status: 200,
      message: 'Successfully found contacts!',
      data: {
        data: contacts.map(formatContactResponse),
        page: page,
        perPage: perPage,
        totalItems: total,
        totalPages: totalPages,
        hasPreviousPage: hasPrevPage,
        hasNextPage: hasNextPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const contact = await Contacts.findOne({
      _id: contactId,
      owner: req.user?.id,
    });

    if (!contact) {
      throw createHttpError(404, 'Contact not found');
    }

    res.status(200).json({
      status: 200,
      message: `Successfully found contact with id ${contactId}!`,
      data: formatContactResponse(contact),
    });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as IUser;
    let photoUrl: string | undefined;

    if (req.file) {
      const result = await uploadImage(req.file);
      photoUrl = result.secure_url;
    }

    const contact = await Contacts.create({
      ...req.body,
      owner: user._id,
      photo: photoUrl,
    });

    res.status(201).json({
      status: 201,
      message: 'Successfully created a contact!',
      data: formatContactResponse(contact),
    });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const user = req.user as IUser;
    let photoUrl: string | undefined;

    if (req.file) {
      const result = await uploadImage(req.file);
      photoUrl = result.secure_url;
    }

    const updatedContact = await Contacts.findOneAndUpdate(
      { _id: contactId, owner: user._id },
      {
        ...req.body,
        ...(photoUrl && { photo: photoUrl }),
      },
      { new: true, runValidators: true, upsert: true },
    );

    if (!updatedContact) {
      throw createHttpError(404, 'Contact not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully patched a contact!',
      data: formatContactResponse(updatedContact),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contact = await Contacts.findOneAndDelete({
      _id: req.params.contactId,
      owner: req.user?.id,
    });

    if (!contact) {
      throw createHttpError(404, 'Contact not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
