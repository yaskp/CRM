
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Unit from '../models/Unit'
import { createError } from '../middleware/errorHandler'

export const getAllUnits = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const units = await Unit.findAll({
            order: [['name', 'ASC']]
        })
        res.json({
            success: true,
            data: units,
            units: units
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
