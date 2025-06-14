import { Request, Express } from 'express';
import { IUser } from './models.ts';


export interface CustomRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

export interface ErrorResponse {
  status: number;
  message: string;
  stack?: string;
}

export interface SuccessResponse<T> {
  status: number;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends SuccessResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
