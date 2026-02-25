
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import WorkItemType from '../models/WorkItemType'
import { createError } from '../middleware/errorHandler'

import { getPagination, getPaginationData } from '../utils/pagination'
import { Op } from 'sequelize'

export const getAllWorkItemTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { search, page, limit } = req.query
        const { limit: l, offset, page: p } = getPagination({ page: page as any, limit: limit as any })

        const where: any = {}
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } }
            ]
        }

        const { count, rows: types } = await WorkItemType.findAndCountAll({
            where,
            limit: l,
            offset,
            order: [['name', 'ASC']]
        })

        res.json({
            success: true,
            data: types,
            pagination: getPaginationData(count, p, l)
        })
    } catch (error) {
        next(error)
    }
}

export const createWorkItemType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, code, uom, description } = req.body

        if (!name) {
            throw createError('Name is required', 400)
        }

        const newItem = await WorkItemType.create({
            name,
            code,
            uom,
            description,
            is_active: true
        })

        res.status(201).json({
            success: true,
            message: 'Work item type created successfully',
            data: newItem
        })
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(createError('A work item type with this name already exists', 409))
        }
        next(error)
    }
}

export const updateWorkItemType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, code, uom, description, is_active } = req.body

        const item = await WorkItemType.findByPk(id)
        if (!item) {
            throw createError('Work item type not found', 404)
        }

        await item.update({
            name,
            code,
            uom,
            description,
            is_active
        })

        res.json({
            success: true,
            message: 'Work item type updated successfully',
            data: item
        })
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(createError('A work item type with this name already exists', 409))
        }
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

export const importWorkItemTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            throw createError('No items provided for import', 400);
        }

        const results = {
            success: [] as any[],
            errors: [] as any[],
            duplicates: [] as any[]
        };

        for (const item of items) {
            try {
                const { name, code, uom, description } = item;

                if (!name) {
                    results.errors.push({
                        item,
                        error: 'Name is required'
                    });
                    continue;
                }

                // Check for duplicates
                const existing = await WorkItemType.findOne({ where: { name } });

                if (existing) {
                    results.duplicates.push({
                        item,
                        error: `Work item type ${name} already exists`
                    });
                    continue;
                }

                const newItem = await WorkItemType.create({
                    name,
                    code,
                    uom,
                    description,
                    is_active: true
                });

                results.success.push(newItem);
            } catch (error: any) {
                results.errors.push({
                    item,
                    error: error.message || 'Internal error'
                });
            }
        }

        res.json({
            success: true,
            message: `Import completed: ${results.success.length} imported, ${results.duplicates.length} duplicates skipped, ${results.errors.length} errors`,
            data: results
        });
    } catch (error) {
        next(error);
    }
}
