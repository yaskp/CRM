import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Role from '../models/Role'
import Permission from '../models/Permission'
import { createError } from '../middleware/errorHandler'

export const getRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const roles = await Role.findAll({
            include: [
                {
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }
            ]
        })
        res.json({
            success: true,
            roles
        })
    } catch (error) {
        next(error)
    }
}

export const getRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const role = await Role.findByPk(id, {
            include: [
                {
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }
            ]
        })
        if (!role) throw createError('Role not found', 404)
        res.json({
            success: true,
            role
        })
    } catch (error) {
        next(error)
    }
}

export const createRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, permissions } = req.body // permissions is array of permission names
        const role = await Role.create({ name })

        if (permissions && Array.isArray(permissions)) {
            // Find permissions by name
            const perms = await Permission.findAll({ where: { name: permissions } })
            await role.setPermissions(perms)
        }

        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            role
        })
    } catch (error) {
        next(error)
    }
}

export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, permissions } = req.body

        const role = await Role.findByPk(id)
        if (!role) throw createError('Role not found', 404)

        await role.update({ name })

        if (permissions && Array.isArray(permissions)) {
            const perms = await Permission.findAll({ where: { name: permissions } })
            await role.setPermissions(perms)
        }

        res.json({
            success: true,
            message: 'Role updated successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const role = await Role.findByPk(id)
        if (!role) throw createError('Role not found', 404)

        await role.destroy()
        res.json({
            success: true,
            message: 'Role deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const getPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const permissions = await Permission.findAll()
        res.json({
            success: true,
            permissions
        })
    } catch (error) {
        next(error)
    }
}
