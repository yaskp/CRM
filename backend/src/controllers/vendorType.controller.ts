import { Request, Response, NextFunction } from 'express'
import VendorType from '../models/VendorType'
import { createError } from '../middleware/errorHandler'

// Get all vendor types
export const getVendorTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { is_active } = req.query

        const where: any = {}

        if (is_active !== undefined) {
            where.is_active = is_active === 'true'
        }

        const vendorTypes = await VendorType.findAll({
            where,
            order: [['name', 'ASC']],
        })

        res.json({
            success: true,
            data: vendorTypes,
        })
    } catch (error) {
        next(error)
    }
}

// Get vendor type by ID
export const getVendorTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const vendorType = await VendorType.findByPk(id)

        if (!vendorType) {
            throw createError('Vendor type not found', 404)
        }

        res.json({
            success: true,
            data: vendorType,
        })
    } catch (error) {
        next(error)
    }
}

// Create vendor type
export const createVendorType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, code, description } = req.body

        if (!name || !code) {
            throw createError('Name and code are required', 400)
        }

        const vendorType = await VendorType.create({
            name,
            code: code.toUpperCase(),
            description,
            is_active: true,
        })

        res.status(201).json({
            success: true,
            message: 'Vendor type created successfully',
            data: vendorType,
        })
    } catch (error) {
        next(error)
    }
}

// Update vendor type
export const updateVendorType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { name, code, description, is_active } = req.body

        const vendorType = await VendorType.findByPk(id)

        if (!vendorType) {
            throw createError('Vendor type not found', 404)
        }

        await vendorType.update({
            name,
            code: code?.toUpperCase(),
            description,
            is_active,
        })

        res.json({
            success: true,
            message: 'Vendor type updated successfully',
            data: vendorType,
        })
    } catch (error) {
        next(error)
    }
}

// Delete vendor type (soft delete)
export const deleteVendorType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const vendorType = await VendorType.findByPk(id)

        if (!vendorType) {
            throw createError('Vendor type not found', 404)
        }

        await vendorType.update({ is_active: false })

        res.json({
            success: true,
            message: 'Vendor type deleted successfully',
        })
    } catch (error) {
        next(error)
    }
}
