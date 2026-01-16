import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import User from '../models/User'
import Role from '../models/Role'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'
import bcrypt from 'bcryptjs'

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query
        const offset = (Number(page) - 1) * Number(limit)

        const where: any = {}
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { employee_id: { [Op.like]: `%${search}%` } }
            ]
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            limit: Number(limit),
            offset,
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    through: { attributes: [] }
                    // Filter by role if provided
                }
            ],
            distinct: true
        })

        res.json({
            success: true,
            users: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(count / Number(limit))
            }
        })
    } catch (error) {
        next(error)
    }
}

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role, as: 'roles', through: { attributes: [] } }]
        })

        if (!user) {
            throw createError('User not found', 404)
        }

        res.json({
            success: true,
            user
        })
    } catch (error) {
        next(error)
    }
}

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, employee_id, role_ids, is_active } = req.body

        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) {
            throw createError('Email already registered', 400)
        }

        const user = await User.create({
            name,
            email,
            password, // Model hooks will hash this
            employee_id,
            is_active: is_active ?? true,
            company_id: req.user?.company_id // Default to creator's company
        })

        if (role_ids && Array.isArray(role_ids)) {
            await user.setRoles(role_ids)
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, email, employee_id, role_ids, is_active } = req.body

        const user = await User.findByPk(id)
        if (!user) {
            throw createError('User not found', 404)
        }

        await user.update({
            name,
            email,
            employee_id,
            is_active
        })

        if (role_ids && Array.isArray(role_ids)) {
            await user.setRoles(role_ids)
        }

        res.json({
            success: true,
            message: 'User updated successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const user = await User.findByPk(id)
        if (!user) {
            throw createError('User not found', 404)
        }

        // Prevent deleting yourself
        if (user.id === req.user?.id) {
            throw createError('Cannot delete your own account', 400)
        }

        await user.destroy()
        res.json({
            success: true,
            message: 'User deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}
