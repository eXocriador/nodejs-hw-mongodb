import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  subscription: 'starter' | 'pro' | 'business';
  avatarURL?: string;
  verify: boolean;
  verificationToken: string | null;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface ISession extends Document {
  userId: IUser['_id'];
  accessToken: string;
  refreshToken: string;
  accessTokenValidUntil: Date;
  refreshTokenValidUntil: Date;
}

export interface IContact extends Document {
  name: string;
  email: string;
  phoneNumber: string;
  isFavourite: boolean;
  owner: IUser['_id'];
  photo?: string;
  contactType: boolean | 'personal';
}

export interface AuthRequest {
  name?: string;
  email: string;
  password: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  phoneNumber: string;
  isFavourite?: boolean;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  isFavourite?: boolean;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  isFavourite?: string;
}

export interface RequestResetEmailRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  token: string;
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface ContactResponse {
  id: IContact['_id'];
  name: string;
  email: string;
  phoneNumber: string;
  isFavourite: boolean;
  owner: IContact['owner'];
  photo?: string;
}

export interface LoginWithGoogleOAuthRequest {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  phoneNumber: string;
  isFavourite?: boolean;
  contactType: string;
}


export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  isFavourite?: boolean;
  contactType?: string;
}
