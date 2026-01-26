import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { createError } from '../middleware/errorHandler'
import BudgetHead from '../models/BudgetHead'
import ProjectBudget from '../models/ProjectBudget'
import PurchaseOrder from '../models/PurchaseOrder'
import PurchaseOrderItem from '../models/PurchaseOrderItem'
import Material from '../models/Material'
import Expense from '../models/Expense'
import { sequelize } from '../database/connection'

export const getBudgetHeads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const heads = await BudgetHead.findAll({
            order: [['code', 'ASC']]
        })
        res.json({ success: true, heads })
    } catch (error) {
        next(error)
    }
}

export const createBudgetHead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, code, type, parent_id } = req.body
        const head = await BudgetHead.create({ name, code, type, parent_id })
        res.status(201).json({ success: true, head })
    } catch (error) {
        next(error)
    }
}

export const getProjectBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params
        const budgets = await ProjectBudget.findAll({
            where: { project_id: projectId },
            include: [{ model: BudgetHead, as: 'head' }]
        })
        res.json({ success: true, budgets })
    } catch (error) {
        next(error)
    }
}

export const updateProjectBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params
        const { budgets } = req.body // Array of { budget_head_id, estimated_amount }

        if (!Array.isArray(budgets)) throw createError('Invalid payload', 400)

        const operations = budgets.map(async (b: any) => {
            const existing = await ProjectBudget.findOne({
                where: { project_id: projectId, budget_head_id: b.budget_head_id }
            })
            if (existing) {
                return existing.update({ estimated_amount: b.estimated_amount })
            } else {
                return ProjectBudget.create({
                    project_id: Number(projectId),
                    budget_head_id: b.budget_head_id,
                    estimated_amount: b.estimated_amount
                })
            }
        })

        await Promise.all(operations)
        res.json({ success: true, message: 'Budget updated successfully' })
    } catch (error) {
        next(error)
    }
}

export const getBudgetAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params

        // 1. Get Plan
        const budgets = await ProjectBudget.findAll({
            where: { project_id: projectId },
            include: [{ model: BudgetHead, as: 'head' }]
        })

        // 2. Get Actuals (Approved POs) via Material mapping
        const items = await PurchaseOrderItem.findAll({
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchaseOrder',
                    where: { project_id: projectId, status: 'approved' },
                    attributes: ['id', 'status']
                },
                {
                    model: Material,
                    as: 'material',
                    attributes: ['id', 'budget_head_id'],
                    required: true
                }
            ],
            attributes: ['id', 'total_amount']
        })

        // Aggregate in JS
        const spentMap: Record<number, number> = {}
        items.forEach((item: any) => {
            const headId = item.material?.budget_head_id
            if (headId) {
                spentMap[headId] = (spentMap[headId] || 0) + Number(item.total_amount)
            }
        })

        // 3. Get Actuals (Expenses)
        const expenses = await Expense.findAll({
            where: { project_id: projectId, status: 'approved' },
            attributes: ['amount', 'budget_head_id']
        })

        expenses.forEach((exp: any) => {
            const headId = exp.budget_head_id
            if (headId) {
                spentMap[headId] = (spentMap[headId] || 0) + Number(exp.amount)
            }
        })

        // Map actuals to budget map
        const analysis = budgets.map((b: any) => {
            const headId = b.budget_head_id
            const spent = spentMap[headId] || 0
            const estimated = Number(b.estimated_amount)

            return {
                head: b.head,
                estimated_amount: estimated,
                spent_amount: spent,
                variance: estimated - spent,
                utilization: estimated > 0 ? (spent / estimated) * 100 : 0
            }
        })

        res.json({ success: true, analysis })

    } catch (error) {
        next(error)
    }
}
