import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
import '../models/index' // Import all models to ensure associations are loaded
import User from '../models/User'
import Role from '../models/Role'
import Permission from '../models/Permission'
import { createError } from './errorHandler'

// Check if user has a specific permission
export const hasPermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401)
      }

      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'roles',
            required: false, // Left join - user may not have roles
            through: { attributes: [] }, // Exclude join table attributes
            include: [
              {
                model: Permission,
                as: 'permissions',
                required: false, // Left join - role may not have permissions
                through: { attributes: [] },
              },
            ],
          },
        ],
      })

      if (!user) {
        throw createError('User not found', 404)
      }

      // Get all permissions from user's roles
      const permissions = new Set<string>()
      const userWithRoles = user as any
      if (userWithRoles.roles && Array.isArray(userWithRoles.roles)) {
        for (const role of userWithRoles.roles) {
          if (role.permissions && Array.isArray(role.permissions)) {
            for (const permission of role.permissions) {
              permissions.add(permission.name)
            }
          }
        }
      }

      // Check if user has the required permission
      if (!permissions.has(permissionName)) {
        throw createError(`Insufficient permissions. Required: ${permissionName}`, 403)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Check if user has any of the specified roles
export const hasRole = (...roleNames: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401)
      }

      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'roles',
            required: false, // Left join - user may not have roles
            through: { attributes: [] },
          },
        ],
      })

      if (!user) {
        throw createError('User not found', 404)
      }

      const userWithRoles = user as any
      const userRoles = userWithRoles.roles?.map((role: any) => role.name) || []
      const hasRequiredRole = roleNames.some((roleName) => userRoles.includes(roleName))

      if (!hasRequiredRole) {
        throw createError(`Insufficient role permissions. Required one of: ${roleNames.join(', ')}`, 403)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Helper function to check if user has permission (used in controllers)
export const checkPermission = async (userId: number, permissionName: string): Promise<boolean> => {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          required: false,
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'permissions',
              required: false,
              through: { attributes: [] },
            },
          ],
        },
      ],
    })

    if (!user) return false

    const userWithRoles = user as any
    const permissions = new Set<string>()
    if (userWithRoles.roles && Array.isArray(userWithRoles.roles)) {
      for (const role of userWithRoles.roles) {
        if (role.permissions && Array.isArray(role.permissions)) {
          for (const permission of role.permissions) {
            permissions.add(permission.name)
          }
        }
      }
    }

    return permissions.has(permissionName)
  } catch (error) {
    return false
  }
}

// Helper function to get user roles
export const getUserRoles = async (userId: number): Promise<string[]> => {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          required: false,
          through: { attributes: [] },
        },
      ],
    })

    if (!user) return []

    const userWithRoles = user as any
    return userWithRoles.roles?.map((role: any) => role.name) || []
  } catch (error) {
    return []
  }
}

