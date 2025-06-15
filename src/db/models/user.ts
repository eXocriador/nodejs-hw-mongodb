import { model, Schema } from 'mongoose';
import { handeSaveError, setUpdateSettings } from './hooks';
import { IUser } from '../../types/models';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscription: { type: String, enum: ['starter', 'pro', 'business'], default: 'starter' },
    avatarURL: { type: String },
    verify: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    passwordResetToken: {type: String},
    passwordResetExpires: {type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.post('save', handeSaveError);
userSchema.pre('findOneAndUpdate', setUpdateSettings);
userSchema.post('findOneAndUpdate', handeSaveError);

const User = model<IUser>('User', userSchema);
export default User;

