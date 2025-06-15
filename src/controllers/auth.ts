import { Request, Response, NextFunction } from 'express';
import User from '../db/models/user';
import { hashPassword, comparePassword, generateToken } from '../services/auth';
import createHttpError from 'http-errors';
import { authSchema, loginSchema } from '../validation/auth';
import { IUser } from '../types/models';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = authSchema.validate(req.body);
    if (error) {
      throw createHttpError(400, error.message);
    }

    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(409, 'Email in use');
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      status: 201,
      message: "Successfully registered a user!",
      data: user.toObject()
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      throw createHttpError(400, error.message);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError(401, 'Email or password is wrong');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw createHttpError(401, 'Email or password is wrong');
    }

    const accessToken = generateToken(user as IUser);
    res.json({
      status: 200,
      message: "Successfully logged in an user!",
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
};
