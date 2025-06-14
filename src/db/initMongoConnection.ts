import mongoose from 'mongoose';
import { getEnvVar } from '../utils/getEnvVar.ts';

export const initMongoConnection = async (): Promise<void> => {
  try {
    const user = getEnvVar('MONGODB_USER');
    const pwd = getEnvVar('MONGODB_PASSWORD');
    const url = getEnvVar('MONGODB_URL');
    const db = getEnvVar('MONGODB_DB');

    await mongoose.connect(
      `mongodb+srv://${user}:${pwd}@${url}/${db}?retryWrites=true&w=majority`,
    );
    console.log('✅ Mongo connection successfully established!');
  } catch (error) {
    console.error('Error while setting up mongo connection:', error);
    throw error;
  }
};
