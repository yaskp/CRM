import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { ProjectBOQ, ProjectBOQItem, Project, Quotation, QuotationItem } from '../models'
import { createError } from '../middleware/errorHandler'
import { sequelize } from '../database/connection'
import { Op } from 'sequelize'

export const createBOQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction()
    try {
        const { project_id, title, items } = req.body

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw createError('BOQ must have at least one item', 400)
        }

        const project = await Project.findByPk(project_id)
        if (!project) {
            throw createError('Project not found', 404)
        }

        const latestBOQ = await ProjectBOQ.findOne({
            where: { project_id },
            order: [['version', 'DESC']]
        })
        const nextVersion = latestBOQ ? latestBOQ.version + 1 : 1

        const boq = await ProjectBOQ.create({
            project_id,
            title,
            version: nextVersion,
            status: 'draft',
            created_by: req.user!.id,
            total_estimated_amount: 0
        }, { transaction: t })

        let totalAmount = 0
        const itemPromises = items.map((item: any) => {
            const amount = (item.quantity || 0) * (item.estimated_rate || 0)
            totalAmount += amount
            return ProjectBOQItem.create({
                boq_id: boq.id,
                material_id: item.material_id,
                work_item_type_id: item.work_item_type_id,
                building_id: item.building_id,
                floor_id: item.floor_id,
                zone_id: item.zone_id,
                quantity: item.quantity,
                unit: item.unit,
                estimated_rate: item.estimated_rate,
                remarks: item.remarks
            }, { transaction: t })
        })

        await Promise.all(itemPromises)
        await boq.update({ total_estimated_amount: totalAmount }, { transaction: t })
        await t.commit()

        res.status(201).json({
            success: true,
            message: 'BOQ created successfully',
            boq
        })
    } catch (error) {
        await t.rollback()
        next(error)
    }
}

export const getProjectBOQs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { project_id } = req.params
        let boqs = await ProjectBOQ.findAll({
            where: { project_id, is_active: true },
            order: [['version', 'DESC']],
            include: ['creator', 'approver']
        })

        res.json({
            success: true,
            boqs
        })
    } catch (error) {
        console.error('getProjectBOQs Error:', error)
        next(error)
    }
}

export const getBOQDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const boq = await ProjectBOQ.findByPk(id, {
            include: [
                {
                    model: ProjectBOQItem,
                    as: 'items',
                    include: ['material', 'workItemType', 'building', 'floor', 'zone']
                },
                'creator',
                'approver'
            ]
        })

        if (!boq) {
            throw createError('BOQ not found', 404)
        }

        res.json({
            success: true,
            boq
        })
    } catch (error) {
        next(error)
    }
}

export const approveBOQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const boq = await ProjectBOQ.findByPk(id)

        if (!boq) {
            throw createError('BOQ not found', 404)
        }

        await ProjectBOQ.update(
            { status: 'obsolete' },
            { where: { project_id: boq.project_id, status: 'approved' } }
        )

        await boq.update({
            status: 'approved',
            approved_by: req.user!.id,
            approved_at: new Date()
        })

        res.json({
            success: true,
            message: 'BOQ approved successfully',
            boq
        })
    } catch (error) {
        next(error)
    }
}

export const syncBOQFromQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction()
    try {
        const { project_id } = req.params

        const project = await Project.findByPk(project_id)
        if (!project) {
            throw createError('Project not found', 404)
        }

        const quotation = await Quotation.findOne({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { project_id: project.id },
                            { lead_id: { [Op.in]: sequelize.literal(`(SELECT id FROM leads WHERE project_id = ${project.id})`) } }
                        ]
                    },
                    { status: { [Op.in]: ['approved', 'accepted_by_party'] } }
                ]
            },
            order: [['created_at', 'DESC']],
            include: [{ model: QuotationItem, as: 'items' }]
        })

        if (!quotation) {
            throw createError('No approved or accepted quotation found for this project', 404)
        }

        // Deactivate previous BOQs if re-syncing
        await ProjectBOQ.update(
            { is_active: false, status: 'obsolete' },
            { where: { project_id: project.id }, transaction: t }
        )

        const boq = await ProjectBOQ.create({
            project_id: project.id,
            title: `Bill of Quantities (BOQ) - Synced from Quote ${quotation.quotation_number || quotation.id}`,
            version: 1,
            status: 'approved',
            created_by: req.user!.id,
            total_estimated_amount: quotation.total_amount
        }, { transaction: t })

        const materialItems = (quotation.items || [])
            .filter((qi: any) => qi.item_type === 'material' && qi.reference_id)

        console.log(`Syncing ${materialItems.length} material items from Quotation ${quotation.id}`)

        const itemPromises = materialItems.map((qi: any) => {
            return ProjectBOQItem.create({
                boq_id: boq.id,
                material_id: qi.reference_id,
                quantity: qi.quantity,
                unit: qi.unit,
                estimated_rate: qi.rate,
                remarks: `Synced from Quote Item: ${qi.description}`
            }, { transaction: t })
        })

        await Promise.all(itemPromises)

        // Ensure the quotation is linked to the project for future traceability
        if (!quotation.project_id) {
            await quotation.update({ project_id: project.id }, { transaction: t })
        }

        await t.commit()

        res.json({
            success: true,
            message: 'BOQ initialized from Quotation successfully',
            boq
        })
    } catch (error) {
        await t.rollback()
        console.error('Sync Error:', error)
        next(error)
    }
}
