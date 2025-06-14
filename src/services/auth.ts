// import { UsersCollection } from '../db/models/user.ts';
// import { sendEmail } from './email.ts';
// import { TEMPLATES_DIR } from '../constants/index.ts';
// import path from 'path';
// import fs from 'fs/promises';
// import handlebars from 'handlebars';
// import createHttpError from 'http-errors';
import { IUser } from '../types/models.ts'; //ResetPasswordRequest
import jwt from 'jsonwebtoken';
import { getEnvVar } from '../utils/getEnvVar.ts';
import bcrypt from 'bcryptjs';

const JWT_SECRET = getEnvVar('JWT_SECRET');
const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: IUser): string => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): { id: string } => {
  return jwt.verify(token, JWT_SECRET) as { id: string };
};

// export const requestResetToken = async (email: string):Promise<void> => {
//   const user = await UsersCollection.findOne({ email });
//   if (!user) {
//     throw createHttpError(404, 'User not found');
//   }

//   const resetToken = jwt.sign(
//     {
//       sub: user._id,
//       email,
//     },
//     JWT_SECRET,
//     {
//       expiresIn: '15m',
//     },
//   );

//   const resetPasswordTemplatePath = path.join(
//     TEMPLATES_DIR,
//     'reset-password-email.html',
//   );

//   const templateSource = (
//     await fs.readFile(resetPasswordTemplatePath)
//   ).toString();

//   const template = handlebars.compile(templateSource);
//   const html = template({
//     link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
//     year: new Date().getFullYear()
//   });

//   await sendEmail({
//     to: email,
//     subject: 'Reset your password',
//     html,
//   });
// };


// export const resetPassword = async (payload: ResetPasswordRequest): Promise<void> => {
//   let entries;

//   try {
//     entries = jwt.verify(payload.token, JWT_SECRET) as { email: string, sub: string };
//   } catch (err) {
//     if (err instanceof Error) throw createHttpError(401, err.message);
//     throw err;
//   }

//   const user = await UsersCollection.findOne({
//     email: entries.email,
//     _id: entries.sub,
//   });

//   if (!user) {
//     throw createHttpError(404, 'User not found');
//   }

//   const encryptedPassword = await hashPassword(payload.password);

//   await UsersCollection.updateOne(
//     { _id: user._id },
//     { password: encryptedPassword },
//   );
// };
