import { Request, Response, NextFunction } from 'express';
import { register, login } from '../auth';
import User from '../../db/models/user';
import { hashPassword, comparePassword, generateToken } from '../../services/auth';
import createHttpError from 'http-errors';
import { IUser } from '../../types/models';

jest.mock('../../db/models/user');
jest.mock('../../services/auth');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockUser: Partial<IUser> = {
    _id: 'mockUserId',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    toObject: () => ({
      _id: 'mockUserId',
      name: 'Test User',
      email: 'test@example.com'
    })
  };

  beforeEach(() => {
    mockRequest = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 201,
        message: "Successfully registered a user!",
        data: expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not register user with existing email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 409,
        message: 'Email in use'
      }));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        name: 'T', // Too short name
        email: 'invalid-email',
        password: 'weak' // Too weak password
      };

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 400
      }));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'Password123!'
        }
      };
    });

    it('should login user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue('mockToken123');

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 200,
        message: "Successfully logged in an user!",
        data: { accessToken: 'mockToken123' }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not login with non-existent email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 401,
        message: 'Email or password is wrong'
      }));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should not login with wrong password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 401,
        message: 'Email or password is wrong'
      }));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: '' // Empty password
      };

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 400
      }));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
