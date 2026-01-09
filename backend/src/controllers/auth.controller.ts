import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth.middleware'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, employee_id, phone } = req.body

    // Validate input
    if (!name || !email || !password || !employee_id) {
      throw createError('Missing required fields', 400)
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        email,
      },
    })

    if (existingUser) {
      throw createError('User with this email already exists', 400)
    }

    const existingEmployee = await User.findOne({
      where: {
        employee_id,
      },
    })

    if (existingEmployee) {
      throw createError('User with this employee ID already exists', 400)
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash: password, // Will be hashed by hook
      employee_id,
      phone,
      is_active: true,
    })

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, employee_id: user.employee_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw createError('Email and password are required', 400)
    }

    // Find user
    const user = await User.findOne({
      where: { email },
    })

    if (!user) {
      throw createError('Invalid email or password', 401)
    }

    if (!user.is_active) {
      throw createError('Account is inactive', 403)
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401)
    }

    // Update last login
    await user.update({ last_login: new Date() })

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, employee_id: user.employee_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'name', 'email', 'employee_id', 'phone', 'company_id'],
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id)

    if (!user || !user.is_active) {
      throw createError('User not found or inactive', 404)
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, employee_id: user.employee_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      token,
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You can implement token blacklisting here if needed
    res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    next(error)
  }
}

