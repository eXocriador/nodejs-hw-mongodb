import { OAuth2Client } from 'google-auth-library';
import createHttpError from 'http-errors';
import { getEnvVar } from './getEnvVar';

const client = new OAuth2Client(
  getEnvVar('GOOGLE_CLIENT_ID'),
  getEnvVar('GOOGLE_CLIENT_SECRET'),
  getEnvVar('GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback')
);

export const generateAuthUrl = () =>
  client.generateAuthUrl({
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

export const validateCode = async (code: string) => {
  const response = await client.getToken(code);
  if (!response.tokens.id_token) throw createHttpError(401, 'Unauthorized');

  const ticket = await client.verifyIdToken({
    idToken: response.tokens.id_token,
  });
  return ticket;
};

interface GoogleTokenPayload {
  given_name?: string;
  family_name?: string;
}

export const getFullNameFromGoogleTokenPayload = (payload: GoogleTokenPayload) => {
  let fullName = 'Guest';
  if (payload.given_name && payload.family_name) {
    fullName = `${payload.given_name} ${payload.family_name}`;
  } else if (payload.given_name) {
    fullName = payload.given_name;
  }

  return fullName;
};

export const verifyGoogleToken = async (token: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: getEnvVar('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};
