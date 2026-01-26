import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Client from '../models/Client'
import ClientGroup from '../models/ClientGroup'
import ClientContact from '../models/ClientContact'
import Project from '../models/Project'
import { createError } from '../middleware/errorHandler'
import { Op, Transaction } from 'sequelize'
import { sequelize } from '../database/connection'

// Generate client code (e.g., CLT-2026-001)
const generateClientCode = async (): Promise<string> => {
    const year = new Date().getFullYear()
    const prefix = `CLT-${year}-`

    const lastClient = await Client.findOne({
        where: {
            client_code: {
                [Op.like]: `${prefix}%`
            }
        },
        order: [['created_at', 'DESC']]
    })

    let nextNumber = 1
    if (lastClient) {
        const lastNumber = parseInt(lastClient.client_code.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`
}

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            company_name,
            client_group_id,
            contact_person,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            gstin,
            pan,
            payment_terms,
            credit_limit,
            client_type,
            status,
            contacts // Array of contact persons
        } = req.body

        if (!company_name) {
            throw createError('Company name is required', 400)
        }

        const client_code = await generateClientCode()

        // Use transaction to ensure data consistency
        const result = await sequelize.transaction(async (t: Transaction) => {
            // Create client
            const client = await Client.create({
                client_code,
                client_group_id,
                company_name,
                contact_person,
                email,
                phone,
                address,
                city,
                state,
                pincode,
                gstin,
                pan,
                payment_terms,
                credit_limit,
                client_type: client_type || 'company',
                status: status || 'active'
            }, { transaction: t })

            // Create contact persons if provided
            if (contacts && Array.isArray(contacts) && contacts.length > 0) {
                const contactsData = contacts.map((contact: any) => ({
                    client_id: client.id,
                    contact_name: contact.contact_name,
                    designation: contact.designation,
                    email: contact.email,
                    phone: contact.phone,
                    is_primary: contact.is_primary || false
                }))
                await ClientContact.bulkCreate(contactsData, { transaction: t })
            }

            return client
        })

        // Fetch the created client with associations
        const clientWithDetails = await Client.findByPk(result.id, {
            include: [
                { model: ClientGroup, as: 'group' },
                { model: ClientContact, as: 'contacts' }
            ]
        })

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            client: clientWithDetails
        })
    } catch (error) {
        next(error)
    }
}

export const getClients = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { search, status, client_type, client_group_id, page = 1, limit = 10 } = req.query

        const offset = (Number(page) - 1) * Number(limit)
        const where: any = {}

        if (search) {
            where[Op.or] = [
                { company_name: { [Op.like]: `%${search}%` } },
                { client_code: { [Op.like]: `%${search}%` } },
                { contact_person: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ]
        }

        if (status) where.status = status
        if (client_type) where.client_type = client_type
        if (client_group_id) where.client_group_id = client_group_id

        const { count, rows } = await Client.findAndCountAll({
            where,
            include: [
                { model: ClientGroup, as: 'group' },
                { model: ClientContact, as: 'contacts' }
            ],
            limit: Number(limit),
            offset,
            order: [['created_at', 'DESC']]
        })

        res.json({
            success: true,
            clients: rows,
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

export const getClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const client = await Client.findByPk(id, {
            include: [
                { model: ClientGroup, as: 'group' },
                { model: ClientContact, as: 'contacts' }
            ]
        })

        if (!client) {
            throw createError('Client not found', 404)
        }

        res.json({
            success: true,
            client
        })
    } catch (error) {
        next(error)
    }
}

export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const {
            company_name,
            client_group_id,
            contact_person,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            gstin,
            pan,
            payment_terms,
            credit_limit,
            client_type,
            status,
            contacts // Array of contact persons
        } = req.body

        const client = await Client.findByPk(id)

        if (!client) {
            throw createError('Client not found', 404)
        }

        await sequelize.transaction(async (t: Transaction) => {
            // Update client
            await client.update({
                company_name,
                client_group_id,
                contact_person,
                email,
                phone,
                address,
                city,
                state,
                pincode,
                gstin,
                pan,
                payment_terms,
                credit_limit,
                client_type,
                status
            }, { transaction: t })

            // Update contacts if provided
            if (contacts && Array.isArray(contacts)) {
                // Delete existing contacts
                await ClientContact.destroy({ where: { client_id: id }, transaction: t })

                // Create new contacts
                if (contacts.length > 0) {
                    const contactsData = contacts.map((contact: any) => ({
                        client_id: client.id,
                        contact_name: contact.contact_name,
                        designation: contact.designation,
                        email: contact.email,
                        phone: contact.phone,
                        is_primary: contact.is_primary || false
                    }))
                    await ClientContact.bulkCreate(contactsData, { transaction: t })
                }
            }
        })

        // Fetch updated client with associations
        const updatedClient = await Client.findByPk(id, {
            include: [
                { model: ClientGroup, as: 'group' },
                { model: ClientContact, as: 'contacts' }
            ]
        })

        res.json({
            success: true,
            message: 'Client updated successfully',
            client: updatedClient
        })
    } catch (error) {
        next(error)
    }
}

export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const client = await Client.findByPk(id)

        if (!client) {
            throw createError('Client not found', 404)
        }

        // Contacts will be deleted automatically due to CASCADE

        await client.destroy()

        res.json({
            success: true,
            message: 'Client deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

// Client Groups endpoints
export const getClientGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const groups = await ClientGroup.findAll({
            order: [['group_name', 'ASC']]
        })

        res.json({
            success: true,
            groups
        })
    } catch (error) {
        next(error)
    }
}

export const createClientGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { group_name, group_type, description } = req.body

        if (!group_name) {
            throw createError('Group name is required', 400)
        }

        if (!group_type) {
            throw createError('Group type is required', 400)
        }

        const group = await ClientGroup.create({
            group_name,
            group_type,
            description
        })

        res.status(201).json({
            success: true,
            message: 'Client group created successfully',
            group
        })
    } catch (error) {
        next(error)
    }
}

export const updateClientGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { group_name, group_type, description } = req.body

        const group = await ClientGroup.findByPk(id)

        if (!group) {
            throw createError('Client group not found', 404)
        }

        await group.update({ group_name, group_type, description })

        res.json({
            success: true,
            message: 'Client group updated successfully',
            group
        })
    } catch (error) {
        next(error)
    }
}

export const deleteClientGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const group = await ClientGroup.findByPk(id)

        if (!group) {
            throw createError('Client group not found', 404)
        }

        // Check if group has clients
        const clientCount = await Client.count({ where: { client_group_id: id } })
        if (clientCount > 0) {
            throw createError(`Cannot delete group. ${clientCount} client(s) are assigned to this group.`, 400)
        }

        await group.destroy()

        res.json({
            success: true,
            message: 'Client group deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}


export const getClientProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const client = await Client.findByPk(id)
        if (!client) {
            throw createError('Client not found', 404)
        }

        const projects = await Project.findAll({
            where: { client_id: id },
            order: [['created_at', 'DESC']]
        })

        res.json({
            success: true,
            projects
        })
    } catch (error) {
        next(error)
    }
}
