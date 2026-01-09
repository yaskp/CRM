import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { createError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    employee_id: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      throw createError('Authentication token required', 401)
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as { id: number; email: string; employee_id: string }

    req.user = decoded
    next()
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError('Invalid token', 401))
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError('Token expired', 401))
    }
    next(error)
  }
}

