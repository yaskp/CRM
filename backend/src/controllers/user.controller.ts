import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import User from '../models/User'
import Role from '../models/Role'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { search, page = 1, limit = 10 } = req.query
        const offset = (Number(page) - 1) * Number(limit)

        const where: any = {}
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { employee_id: { [Op.like]: `%${search}%` } },
                { username: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ]
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            limit: Number(limit),
            offset,
            attributes: { exclude: ['password_hash'] },
            include: [
                {
                    model: Role,
                    as: 'roles',
                    through: { attributes: [] }
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
            attributes: { exclude: ['password_hash'] },
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
        const { name, email, password, phone, location, role_ids, is_active } = req.body

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { employee_id: phone }, { username: phone }]
            }
        })

        if (existingUser) {
            throw createError('Email or Mobile Number (User ID) already registered', 400)
        }

        const user = await User.create({
            name,
            email,
            password_hash: password, // Model hooks will hash this
            phone,
            location,
            employee_id: phone, // User ID as per requirement
            username: phone,    // Username as per requirement
            is_active: is_active ?? true,
            company_id: req.user?.company_id // Default to creator's company
        })

        if (role_ids && Array.isArray(role_ids)) {
            await user.setRoles(role_ids)
        }

        // Logic to send reset password on common email id would go here
        // console.log(`New user created. Credentials sent to common email. Password: ${password}`)

        res.status(201).json({
            success: true,
            message: 'User created successfully. Login ID is user mobile number.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username
            }
        })
    } catch (error) {
        next(error)
    }
}

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, email, phone, location, role_ids, is_active } = req.body

        const user = await User.findByPk(id)
        if (!user) {
            throw createError('User not found', 404)
        }

        await user.update({
            name,
            email,
            phone,
            location,
            employee_id: phone, // Keep sync if changed
            username: phone,
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

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { newPassword } = req.body

        if (!newPassword) {
            throw createError('New password is required', 400)
        }

        const user = await User.findByPk(id)
        if (!user) {
            throw createError('User not found', 404)
        }

        await user.update({ password_hash: newPassword })

        res.json({
            success: true,
            message: 'Password reset successfully. Please share the new password with the user.'
        })
    } catch (error) {
        next(error)
    }
}

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body

        const user = await User.findByPk(req.user!.id)
        if (!user) {
            throw createError('User not found', 404)
        }

        const isMatch = await user.comparePassword(currentPassword)
        if (!isMatch) {
            throw createError('Invalid current password', 401)
        }

        await user.update({ password_hash: newPassword })

        res.json({
            success: true,
            message: 'Password changed successfully'
        })
    } catch (error) {
        next(error)
    }
}

