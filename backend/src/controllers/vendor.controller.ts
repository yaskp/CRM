import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import Vendor from '../models/Vendor'
import ProjectVendor from '../models/ProjectVendor'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth.middleware'
import { getStateCodeFromGST, getStateNameFromCode } from '../utils/gstCalculator'

// Get all vendors
export const getVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { vendor_type, is_active, search } = req.query

        const where: any = {}

        if (vendor_type) {
            where.vendor_type = vendor_type
        }

        if (is_active !== undefined) {
            where.is_active = is_active === 'true'
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { contact_person: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
            ]
        }

        const vendors = await Vendor.findAll({
            where,
            order: [['name', 'ASC']],
        })

        const vendorsWithState = vendors.map(v => {
            const val = v.toJSON() as any
            if (!val.state && val.state_code) {
                val.state = getStateNameFromCode(val.state_code)
            }
            return val
        })

        res.json({
            success: true,
            vendors: vendorsWithState,
        })
    } catch (error) {
        next(error)
    }
}

// Get vendor by ID
export const getVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const vendor = await Vendor.findByPk(id, {
            include: [
                {
                    association: 'projects',
                    attributes: ['id', 'name', 'project_code'],
                },
            ],
        })

        if (!vendor) {
            throw createError('Vendor not found', 404)
        }

        const vendorData = vendor.toJSON() as any
        if (!vendorData.state && vendorData.state_code) {
            vendorData.state = getStateNameFromCode(vendorData.state_code)
        }

        res.json({
            success: true,
            vendor: vendorData,
        })
    } catch (error) {
        next(error)
    }
}

// Create vendor
export const createVendor = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            name,
            vendor_type,
            contact_person,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            gst_number,
            pan_number,
            bank_name,
            account_number,
            ifsc_code,
            branch,
            bank_details,
            state_code,
        } = req.body

        if (!name || !vendor_type) {
            throw createError('Name and vendor type are required', 400)
        }

        // Auto-extract state code from GST if not provided
        let finalStateCode = state_code
        if (!finalStateCode && gst_number) {
            finalStateCode = getStateCodeFromGST(gst_number)
        }

        const derivedStateName = state || getStateNameFromCode(finalStateCode || '')

        const vendor = await Vendor.create({
            name,
            vendor_type,
            contact_person,
            phone,
            email,
            address,
            city,
            state: derivedStateName,
            pincode,
            state_code: finalStateCode,
            gst_number,
            pan_number,
            bank_name,
            account_number,
            ifsc_code,
            branch,
            bank_details,
            is_active: true,
        })

        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            vendor,
        })
    } catch (error) {
        next(error)
    }
}

// Update vendor
export const updateVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const {
            name,
            vendor_type,
            contact_person,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            gst_number,
            pan_number,
            bank_name,
            account_number,
            ifsc_code,
            branch,
            bank_details,
            state_code,
            is_active,
        } = req.body

        const vendor = await Vendor.findByPk(id)

        if (!vendor) {
            throw createError('Vendor not found', 404)
        }

        // Auto-extract state code from GST if not provided
        let finalStateCode = state_code
        if (!finalStateCode && gst_number) {
            finalStateCode = getStateCodeFromGST(gst_number)
        }

        const derivedStateName = state || getStateNameFromCode(finalStateCode || '')

        await vendor.update({
            name,
            vendor_type,
            contact_person,
            phone,
            email,
            address,
            city,
            state: derivedStateName,
            pincode,
            state_code: finalStateCode,
            gst_number,
            pan_number,
            bank_name,
            account_number,
            ifsc_code,
            branch,
            bank_details,
            is_active,
        })

        res.json({
            success: true,
            message: 'Vendor updated successfully',
            vendor,
        })
    } catch (error) {
        next(error)
    }
}

// Delete vendor (soft delete)
export const deleteVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const vendor = await Vendor.findByPk(id)

        if (!vendor) {
            throw createError('Vendor not found', 404)
        }

        await vendor.update({ is_active: false })

        res.json({
            success: true,
            message: 'Vendor deleted successfully',
        })
    } catch (error) {
        next(error)
    }
}

// Assign vendor to project
export const assignVendorToProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { vendor_id, project_id, vendor_type, rate, rate_unit, start_date } = req.body

        if (!vendor_id || !project_id || !vendor_type) {
            throw createError('Vendor ID, Project ID, and Vendor Type are required', 400)
        }

        const projectVendor = await ProjectVendor.create({
            vendor_id,
            project_id,
            vendor_type,
            rate,
            rate_unit,
            start_date,
            status: 'active',
        })

        res.status(201).json({
            success: true,
            message: 'Vendor assigned to project successfully',
            projectVendor,
        })
    } catch (error) {
        next(error)
    }
}

// Get project vendors
export const getProjectVendors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params

        const projectVendors = await ProjectVendor.findAll({
            where: { project_id: projectId },
            include: ['vendor'],
        })

        res.json({
            success: true,
            projectVendors,
        })
    } catch (error) {
        next(error)
    }
}

// Update project vendor
export const updateProjectVendor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { rate, rate_unit, end_date, status } = req.body

        const projectVendor = await ProjectVendor.findByPk(id)

        if (!projectVendor) {
            throw createError('Project vendor assignment not found', 404)
        }

        await projectVendor.update({
            rate,
            rate_unit,
            end_date,
            status,
        })

        res.json({
            success: true,
            message: 'Project vendor updated successfully',
            projectVendor,
        })
    } catch (error) {
        next(error)
    }
}

// Remove vendor from project
export const removeVendorFromProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const projectVendor = await ProjectVendor.findByPk(id)

        if (!projectVendor) {
            throw createError('Project vendor assignment not found', 404)
        }

        await projectVendor.update({ status: 'terminated' })

        res.json({
            success: true,
            message: 'Vendor removed from project successfully',
        })
    } catch (error) {
        next(error)
    }
}
