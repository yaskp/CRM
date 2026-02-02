import { Request, Response, NextFunction } from 'express'
import { FinancialTransaction, PaymentAllocation, PurchaseOrder, WorkOrder, Project, Vendor, Client } from '../models'
import { sequelize } from '../database/connection'
import { Op } from 'sequelize'

// Extend Request to include user
interface AuthRequest extends Request {
    user?: any
}

export const createFinancialTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction()
    try {
        const {
            transaction_date,
            type,
            category,
            amount,
            tds_amount = 0,
            retention_amount = 0,
            net_amount,
            project_id,
            vendor_id,
            client_id,
            user_id,
            payment_mode,
            reference_number,
            bank_name,
            bank_account_id,
            remarks,
            attachment_url,
            allocations // Array of { purchase_order_id, work_order_id, expense_id, allocated_amount, tds_allocated, retention_allocated }
        } = req.body

        // 1. Generate Transaction Number
        const transaction_number = `FT-${Date.now()}`

        // 2. Create Transaction
        const financialTransaction = await FinancialTransaction.create({
            transaction_number,
            transaction_date,
            type,
            category,
            amount,
            tds_amount,
            retention_amount,
            net_amount,
            project_id,
            vendor_id,
            client_id,
            user_id,
            payment_mode,
            reference_number,
            bank_name,
            bank_account_id,
            status: 'cleared',
            remarks,
            attachment_url,
            created_by: req.user.id
        }, { transaction: t })

        // 3. Create Allocations if any
        if (allocations && Array.isArray(allocations)) {
            for (const allocation of allocations) {
                await PaymentAllocation.create({
                    financial_transaction_id: financialTransaction.id,
                    purchase_order_id: allocation.purchase_order_id,
                    work_order_id: allocation.work_order_id,
                    expense_id: allocation.expense_id,
                    allocated_amount: allocation.allocated_amount,
                    tds_allocated: allocation.tds_allocated || 0,
                    retention_allocated: allocation.retention_allocated || 0
                }, { transaction: t })
            }
        }

        await t.commit()
        res.status(201).json({ success: true, financialTransaction })
    } catch (error) {
        if (t) await t.rollback()
        next(error)
    }
}

export const getFinancialTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { project_id, vendor_id, client_id, start_date, end_date } = req.query
        const where: any = {}
        if (project_id) where.project_id = project_id
        if (vendor_id) where.vendor_id = vendor_id
        if (client_id) where.client_id = client_id

        if (start_date && end_date) {
            where.transaction_date = { [Op.between]: [start_date, end_date] }
        } else if (start_date) {
            where.transaction_date = { [Op.gte]: start_date }
        } else if (end_date) {
            where.transaction_date = { [Op.lte]: end_date }
        }

        const transactions = await FinancialTransaction.findAll({
            where,
            include: [
                { model: Project, as: 'project', attributes: ['name', 'project_code'] },
                { model: Vendor, as: 'vendor', attributes: ['name'] },
                { model: Client, as: 'client', attributes: ['company_name'] },
                { model: PaymentAllocation, as: 'allocations' }
            ],
            order: [['transaction_date', 'DESC']]
        })

        res.json({ success: true, transactions })
    } catch (error) {
        next(error)
    }
}

export const getTransactionDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const transaction = await FinancialTransaction.findByPk(req.params.id, {
            include: [
                { model: Project, as: 'project' },
                { model: Vendor, as: 'vendor' },
                { model: Client, as: 'client' },
                {
                    model: PaymentAllocation, as: 'allocations', include: [
                        { model: PurchaseOrder, as: 'purchaseOrder', attributes: ['po_number', 'total_amount'] },
                        { model: WorkOrder, as: 'workOrder', attributes: ['id', 'total_amount'] }
                    ]
                }
            ]
        })
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' })
        }
        return res.json({ success: true, transaction })
    } catch (error) {
        return next(error)
    }
}
