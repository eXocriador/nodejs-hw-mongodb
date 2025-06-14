import { promises as fs } from 'fs';

export const createDirIfNotExists = async (url: string): Promise<void> => {
  try {
    await fs.access(url);
  } catch (error) {
    await fs.mkdir(url, { recursive: true });
  }
};
