import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
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
            include: [
              {
                model: Permission,
                as: 'permissions',
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
      if (user.roles) {
        for (const role of user.roles) {
          if (role.permissions) {
            for (const permission of role.permissions) {
              permissions.add(permission.name)
            }
          }
        }
      }

      // Check if user has the required permission
      if (!permissions.has(permissionName)) {
        throw createError('Insufficient permissions', 403)
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
          },
        ],
      })

      if (!user) {
        throw createError('User not found', 404)
      }

      const userRoles = user.roles?.map((role) => role.name) || []
      const hasRequiredRole = roleNames.some((roleName) => userRoles.includes(roleName))

      if (!hasRequiredRole) {
        throw createError('Insufficient role permissions', 403)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

