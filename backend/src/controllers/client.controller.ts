import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Client from '../models/Client'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

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
        } = req.body

        if (!company_name) {
            throw createError('Company name is required', 400)
        }

        const client_code = await generateClientCode()

        const client = await Client.create({
            client_code,
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
        })

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            client
        })
    } catch (error) {
        next(error)
    }
}

export const getClients = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { search, status, client_type, page = 1, limit = 10 } = req.query

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

        const { count, rows } = await Client.findAndCountAll({
            where,
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

        const client = await Client.findByPk(id)

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
        } = req.body

        const client = await Client.findByPk(id)

        if (!client) {
            throw createError('Client not found', 404)
        }

        await client.update({
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
            client_type,
            status
        })

        res.json({
            success: true,
            message: 'Client updated successfully',
            client
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

        // Check if client has associated projects or invoices
        // TODO: Add checks when invoice module is implemented

        await client.destroy()

        res.json({
            success: true,
            message: 'Client deleted successfully'
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

        // TODO: Fetch projects when client_id is added to projects table
        res.json({
            success: true,
            projects: []
        })
    } catch (error) {
        next(error)
    }
}
