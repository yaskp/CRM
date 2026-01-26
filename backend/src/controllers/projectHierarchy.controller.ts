import { Request, Response, NextFunction } from 'express'
import { ProjectBuilding, ProjectFloor, ProjectZone, WorkItemType } from '../models'
import { createError } from '../middleware/errorHandler'

// Buildings
export const getBuildings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project_id } = req.query
        const where: any = {}
        if (project_id) where.project_id = project_id

        const buildings = await ProjectBuilding.findAll({
            where,
            include: [{ model: ProjectFloor, as: 'floors' }]
        })
        res.json({ success: true, buildings })
    } catch (error) {
        next(error)
    }
}

export const createBuilding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const building = await ProjectBuilding.create(req.body)
        res.status(201).json({ success: true, building })
    } catch (error) {
        next(error)
    }
}

// Floors
export const getFloors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { building_id } = req.query
        const where: any = {}
        if (building_id) where.building_id = building_id

        const floors = await ProjectFloor.findAll({
            where,
            include: [{ model: ProjectZone, as: 'zones' }]
        })
        res.json({ success: true, floors })
    } catch (error) {
        next(error)
    }
}

export const createFloor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const floor = await ProjectFloor.create(req.body)
        res.status(201).json({ success: true, floor })
    } catch (error) {
        next(error)
    }
}

// Zones
export const getZones = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { floor_id } = req.query
        const where: any = {}
        if (floor_id) where.floor_id = floor_id

        const zones = await ProjectZone.findAll({ where })
        res.json({ success: true, zones })
    } catch (error) {
        next(error)
    }
}

export const createZone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const zone = await ProjectZone.create(req.body)
        res.status(201).json({ success: true, zone })
    } catch (error) {
        next(error)
    }
}

// Bulk Hierarchy for Project
export const getProjectHierarchy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params
        const hierarchy = await ProjectBuilding.findAll({
            where: { project_id: projectId },
            include: [
                {
                    model: WorkItemType,
                    as: 'workItemType',
                    attributes: ['id', 'name', 'code', 'uom']
                },
                {
                    model: ProjectFloor,
                    as: 'floors',
                    include: [{
                        model: ProjectZone,
                        as: 'zones',
                        include: [{
                            model: WorkItemType,
                            as: 'workItemType',
                            attributes: ['id', 'name', 'code', 'uom']
                        }]
                    }]
                }
            ]
        })
        res.json({ success: true, hierarchy })
    } catch (error) {
        next(error)
    }
}
