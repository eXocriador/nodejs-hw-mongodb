import { v2 as cloudinary } from 'cloudinary';
import { getEnvVar } from '../utils/getEnvVar';
import { CloudinaryResponse } from '../types/models';
import { Express } from 'express';

cloudinary.config({
  cloud_name: getEnvVar('CLOUDINARY_CLOUD_NAME'),
  api_key: getEnvVar('CLOUDINARY_API_KEY'),
  api_secret: getEnvVar('CLOUDINARY_API_SECRET'),
});

export const uploadImage = async (file: Express.Multer.File): Promise<CloudinaryResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'contacts',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
