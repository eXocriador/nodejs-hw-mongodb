import { Response, NextFunction } from 'express';
import { IUser } from '../types/models';
import { CustomRequest } from '../types/index';
import { getPaginationParams, formatContactResponse } from '../services/contacts';
import { Contacts } from '../db/models/contact';
import { uploadImage, deleteImage } from '../services/cloudinary';
import createHttpError from 'http-errors';
import { parseSortParams } from '../utils/filters/parseSortParams';
import { parseFilterParams } from '../utils/filters/parseFilterParams';

export const getContacts = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { sortBy, sortOrder } = parseSortParams(req.query);
    const filters = parseFilterParams(req.query);

    const query = {
      owner: req.user?.id,
      ...filters
    };

    const [contacts, total] = await Promise.all([
      Contacts.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Contacts.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      status: 200,
      message: 'Successfully found contacts!',
      data: {
        data: contacts.map(formatContactResponse),
        page: page,
        perPage: limit,
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
  next: NextFunction
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
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const contactData = req.body;

    if (req.file) {
      const photoData = await uploadImage(req.file);
      contactData.photo = photoData;
    }

    const contact = await Contacts.create({
      ...contactData,
      owner: user._id,
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
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const user = req.user as IUser;
    const updateData = req.body;

    const contact = await Contacts.findOne({ _id: contactId, owner: user._id });
    if (!contact) {
      throw createHttpError(404, 'Contact not found');
    }

    if (req.file) {
      if (contact.photo?.public_id) {
        await deleteImage(contact.photo.public_id);
      }
      const photoData = await uploadImage(req.file);
      updateData.photo = photoData;
    }

    const updatedContact = await Contacts.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
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
  next: NextFunction
): Promise<void> => {
  try {
    const contact = await Contacts.findOne({
      _id: req.params.contactId,
      owner: req.user?.id,
    });

    if (!contact) {
      throw createHttpError(404, 'Contact not found');
    }

    if (contact.photo?.public_id) {
      await deleteImage(contact.photo.public_id);
    }

    await Contacts.findByIdAndDelete(contact._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
