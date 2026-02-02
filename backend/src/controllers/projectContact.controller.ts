import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import ProjectContact from '../models/ProjectContact'
import { createError } from '../middleware/errorHandler'

export const getProjectContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params
        const contacts = await ProjectContact.findAll({
            where: { project_id: projectId },
            order: [['name', 'ASC']]
        })
        res.json({ success: true, contacts })
    } catch (error) {
        next(error)
    }
}

export const createProjectContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params
        const contact = await ProjectContact.create({
            ...req.body,
            project_id: Number(projectId)
        })
        res.status(201).json({ success: true, contact })
    } catch (error) {
        next(error)
    }
}

export const updateProjectContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const contact = await ProjectContact.findByPk(id)
        if (!contact) throw createError('Contact not found', 404)

        await contact.update(req.body)
        res.json({ success: true, contact })
    } catch (error) {
        next(error)
    }
}

export const deleteProjectContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const contact = await ProjectContact.findByPk(id)
        if (!contact) throw createError('Contact not found', 404)

        await contact.destroy()
        res.json({ success: true, message: 'Contact deleted successfully' })
    } catch (error) {
        next(error)
    }
}
