import { model, Schema } from 'mongoose';
import { handeSaveError, setUpdateSettings } from './hooks';
import { IContact } from '../../types/models'; // Імпортуємо IContact з types/models.ts
import { typeList } from '../../constants/contacts';

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Важливо, щоб це посилалося на модель User
      required: true,
    },
    photo: {
      secure_url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    contactType: {
      type: String,
      enum: typeList,
      default: 'personal',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false, // Додано для консистентності з іншими моделями в db/models
  },
);

contactSchema.post('save', handeSaveError);
contactSchema.pre('findOneAndUpdate', setUpdateSettings);
contactSchema.post('findOneAndUpdate', handeSaveError);

export const Contacts = model<IContact>('Contact', contactSchema); // Експортуємо як Contacts
