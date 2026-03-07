import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import '../models/index' // Import all models to ensure associations are loaded
import User from '../models/User'
import Role from '../models/Role'
import Permission from '../models/Permission'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth.middleware'
import { Op } from 'sequelize'

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
      username: employee_id, // Default username to employee_id
      phone,
      is_active: true,
    })

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, employee_id: user.employee_id, company_id: user.company_id },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN as any }
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
    const { email, username, password } = req.body
    const loginIdentifier = email || username

    if (!loginIdentifier || !password) {
      throw createError('Email/Username and password are required', 400)
    }

    // Find user by email or username (employee_id)
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginIdentifier },
          { employee_id: loginIdentifier },
          { username: loginIdentifier },
        ],
      },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        },
      ],
    })

    if (!user) {
      throw createError('Invalid email/username or password', 401)
    }

    if (!user.is_active) {
      throw createError('Account is inactive', 403)
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw createError('Invalid email/username or password', 401)
    }

    // Update last login
    await user.update({ last_login: new Date() })

    // Get user roles and permissions
    const roles = (user as any).roles?.map((role: any) => role.name) || []
    const roleIds = (user as any).roles?.map((role: any) => role.id) || []

    // Get unique permission names from all roles
    const permissions = Array.from(new Set(
      (user as any).roles?.flatMap((role: any) =>
        role.permissions?.map((p: any) => p.name) || []
      )
    ))

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, employee_id: user.employee_id, company_id: user.company_id, roles, permissions },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN as any }
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
        roles,
        roleIds,
        permissions,
        location: user.location,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'name', 'email', 'employee_id', 'phone', 'company_id', 'location'],
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        },
      ],
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    const roles = (user as any).roles?.map((role: any) => role.name) || []
    const roleIds = (user as any).roles?.map((role: any) => role.id) || []

    // Get unique permission names from all roles
    const permissions = Array.from(new Set(
      (user as any).roles?.flatMap((role: any) =>
        role.permissions?.map((p: any) => p.name) || []
      )
    ))

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
        phone: user.phone,
        location: user.location,
        company_id: user.company_id,
        roles,
        roleIds,
        permissions,
      },
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
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN as any }
    )

    res.json({
      success: true,
      token,
    })
  } catch (error) {
    next(error)
  }
}

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
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

