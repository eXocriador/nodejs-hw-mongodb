import { Response, NextFunction } from 'express';
import { IUser } from '../types/models.ts';
import { CustomRequest } from '../types/index.ts';
import { getPaginationParams, formatContactResponse } from '../services/contacts.ts';
import { Contacts } from '../db/models/contact.ts';
import { uploadImage, deleteImage } from '../services/cloudinary.ts';

export const getContacts = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, skip, favorite } = getPaginationParams(req.query);
    const query = { owner: req.user?.id, ...(favorite && { favorite }) };

    const [contacts, total] = await Promise.all([
      Contacts.find(query).skip(skip).limit(limit),
      Contacts.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      contacts: contacts.map(formatContactResponse),
      page,
      limit,
      total,
      pages: totalPages,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
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
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    res.json(formatContactResponse(contact));
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

    res.status(201).json(formatContactResponse(contact));
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
      res.status(404).json({ message: 'Contact not found' });
      return;
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
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    res.json(formatContactResponse(updatedContact));
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
      res.status(404).json({ message: 'Contact not found' });
      return;
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

export const updateStatusContact = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const user = req.user as IUser;
    const { favorite } = req.body;

    const contact = await Contacts.findOne({ _id: contactId, owner: user._id });
    if (!contact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    const updatedContact = await Contacts.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );

    if (!updatedContact) {
      res.status(404).json({ message: 'Contact not found' });
      return;
    }

    res.json(formatContactResponse(updatedContact));
  } catch (error) {
    next(error);
  }
};
