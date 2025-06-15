import mongoose from 'mongoose';
import { getEnvVar } from '../utils/getEnvVar';

export const initMongoConnection = async (): Promise<void> => {
  try {
    const user = getEnvVar('MONGODB_USER');
    const pwd = getEnvVar('MONGODB_PASSWORD');
    const url = getEnvVar('MONGODB_URL');
    const db = getEnvVar('MONGODB_DB');

    await mongoose.connect(
      `mongodb+srv://${user}:${pwd}@${url}/${db}?retryWrites=true&w=majority`,
    );
  } catch (error) {
    throw error;
  }
};
