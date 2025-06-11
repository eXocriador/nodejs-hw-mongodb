// src/db/models/user.js
import { model, Schema } from 'mongoose';
import { handeSaveError, setUpdateSettings } from './hooks.js';
import { emailRegex } from '../../constants/auth.js';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: emailRegex,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.post('save', handeSaveError);
userSchema.pre('findOneAndUpdate', setUpdateSettings);
userSchema.post('findOneAndUpdate', handeSaveError);

export const UsersCollection = model('user', userSchema);
