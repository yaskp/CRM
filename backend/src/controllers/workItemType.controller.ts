
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import WorkItemType from '../models/WorkItemType'
import { createError } from '../middleware/errorHandler'

export const getAllWorkItemTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const types = await WorkItemType.findAll({
            where: { is_active: true },
            order: [['name', 'ASC']]
        })
        res.json({
            success: true,
            data: types
        })
    } catch (error) {
        next(error)
    }
}

export const createWorkItemType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, code, description } = req.body

        if (!name) {
            throw createError('Name is required', 400)
        }

        const newItem = await WorkItemType.create({
            name,
            code,
            description,
            is_active: true
        })

        res.status(201).json({
            success: true,
            message: 'Work item type created successfully',
            data: newItem
        })
    } catch (error) {
        next(error)
    }
}

export const updateWorkItemType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, code, description, is_active } = req.body

        const item = await WorkItemType.findByPk(id)
        if (!item) {
            throw createError('Work item type not found', 404)
        }

        await item.update({
            name,
            code,
            description,
            is_active
        })

        res.json({
            success: true,
            message: 'Work item type updated successfully',
            data: item
        })
    } catch (error) {
        next(error)
    }
}

export const deleteWorkItemType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const item = await WorkItemType.findByPk(id)
        if (!item) {
            throw createError('Work item type not found', 404)
        }

        // Soft delete by setting is_active false
        await item.update({ is_active: false })

        res.json({
            success: true,
            message: 'Work item type deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}
