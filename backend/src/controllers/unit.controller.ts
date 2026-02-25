
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Unit from '../models/Unit'
import { createError } from '../middleware/errorHandler'

import { getPagination, getPaginationData } from '../utils/pagination'
import { Op } from 'sequelize'

export const getAllUnits = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

        const { count, rows: units } = await Unit.findAndCountAll({
            where,
            limit: l,
            offset,
            order: [['name', 'ASC']]
        })

        res.json({
            success: true,
            data: units,
            units: units,
            pagination: getPaginationData(count, p, l)
        })
    } catch (error) {
        next(error)
    }
}

export const createUnit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, code, base_unit_id, conversion_factor } = req.body

        if (!name || !code) {
            throw createError('Name and Code are required', 400)
        }

        const newUnit = await Unit.create({
            name,
            code,
            base_unit_id: base_unit_id || null,
            conversion_factor: conversion_factor || 1.0,
            is_active: true
        })

        res.status(201).json({
            success: true,
            message: 'Unit created successfully',
            data: newUnit
        })
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(createError('A unit with this code already exists', 409))
        }
        next(error)
    }
}

export const updateUnit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, code, is_active, base_unit_id, conversion_factor } = req.body

        const unit = await Unit.findByPk(id)
        if (!unit) {
            throw createError('Unit not found', 404)
        }

        await unit.update({
            name,
            code,
            is_active,
            base_unit_id: base_unit_id || null,
            conversion_factor: conversion_factor || 1.0
        })

        res.json({
            success: true,
            message: 'Unit updated successfully',
            data: unit
        })
    } catch (error) {
        next(error)
    }
}

export const deleteUnit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const unit = await Unit.findByPk(id)
        if (!unit) {
            throw createError('Unit not found', 404)
        }

        // Soft delete by setting is_active false
        await unit.update({ is_active: false })

        res.json({
            success: true,
            message: 'Unit deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const importUnits = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
                const { name, code, base_unit_id, conversion_factor } = item;

                if (!name || !code) {
                    results.errors.push({
                        item,
                        error: 'Name and Code are required'
                    });
                    continue;
                }

                // Check for duplicates
                const existing = await Unit.findOne({ where: { code } });

                if (existing) {
                    results.duplicates.push({
                        item,
                        error: `Unit code ${code} already exists`
                    });
                    continue;
                }

                const newUnit = await Unit.create({
                    name,
                    code,
                    base_unit_id: base_unit_id || null,
                    conversion_factor: conversion_factor || 1.0,
                    is_active: true
                });

                results.success.push(newUnit);
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
