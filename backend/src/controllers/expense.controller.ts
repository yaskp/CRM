import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Expense from '../models/Expense'
import ExpenseApproval from '../models/ExpenseApproval'
import Notification from '../models/Notification'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Configure multer for expense file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'expenses')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

export const expenseUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, PDF'))
    }
  },
}).fields([
  { name: 'bill', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
])

export const generateExpenseNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `EXP-${year}-`

  const latestExpense = await Expense.findOne({
    where: {
      expense_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['expense_number', 'DESC']],
  })

  let sequence = 1
  if (latestExpense) {
    const lastCode = latestExpense.expense_number
    const lastSequence = parseInt(lastCode.split('-')[2]) || 0
    sequence = lastSequence + 1
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`
}

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  expenseUpload(req as any, res, async (err) => {
    if (err) {
      return next(createError(err.message, 400))
    }

    try {
      const {
        project_id,
        expense_type,
        amount,
        description,
        expense_date,
        input_method,
        bill_type,
      } = req.body

      if (!project_id || !expense_type || !amount || !expense_date) {
        return next(createError('Project, expense type, amount, and date are required', 400))
      }

      const files = (req as any).files
      let bill_url = undefined
      let selfie_url = undefined

      if (files?.bill && files.bill[0]) {
        bill_url = `/uploads/expenses/${files.bill[0].filename}`
      }
      if (files?.selfie && files.selfie[0]) {
        selfie_url = `/uploads/expenses/${files.selfie[0].filename}`
      }

      const expense_number = await generateExpenseNumber()

      const expense = await Expense.create({
        expense_number,
        project_id: Number(project_id),
        expense_type,
        amount: Number(amount),
        description,
        expense_date,
        bill_url,
        selfie_url,
        input_method: input_method || 'manual',
        bill_type,
        status: 'pending_approval_1',
        submitted_by: req.user!.id,
      })

      // Create approval records for 3 levels
      await ExpenseApproval.bulkCreate([
        {
          expense_id: expense.id,
          approval_level: 1,
          approver_role: 'store_manager',
          status: 'pending',
        },
        {
          expense_id: expense.id,
          approval_level: 2,
          approver_role: 'operation_manager',
          status: 'pending',
        },
        {
          expense_id: expense.id,
          approval_level: 3,
          approver_role: 'head_accounts',
          status: 'pending',
        },
      ])

      // Create notification for Store Manager
      // TODO: Implement notification creation

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        expense,
      })
    } catch (error) {
      next(error)
    }
  })
}

export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, status, expense_type, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (status) where.status = status
    if (expense_type) where.expense_type = expense_type

    // Filter by user if not admin
    // TODO: Add role check

    const { count, rows } = await Expense.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['expense_date', 'DESC']],
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'submitter',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'approvals',
        },
      ],
    })

    res.json({
      success: true,
      expenses: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const expense = await Expense.findByPk(id, {
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'submitter',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'approvals',
          include: [
            {
              association: 'approver',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    })

    if (!expense) {
      throw createError('Expense not found', 404)
    }

    res.json({
      success: true,
      expense,
    })
  } catch (error) {
    next(error)
  }
}

export const approveExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { level, comments } = req.body

    const expense = await Expense.findByPk(id, {
      include: [{ association: 'approvals' }],
    })

    if (!expense) {
      throw createError('Expense not found', 404)
    }

    const approval = expense.approvals?.find((a: any) => a.approval_level === level)
    if (!approval) {
      throw createError('Approval level not found', 404)
    }

    await approval.update({
      status: 'approved',
      approver_id: req.user!.id,
      comments,
      approved_at: new Date(),
    })

    // Update expense status
    if (level === 1) {
      await expense.update({ status: 'pending_approval_2' })
    } else if (level === 2) {
      await expense.update({ status: 'pending_approval_3' })
    } else if (level === 3) {
      await expense.update({ status: 'approved' })
    }

    res.json({
      success: true,
      message: `Expense approved at level ${level}`,
      expense: await Expense.findByPk(id, {
        include: [{ association: 'approvals' }],
      }),
    })
  } catch (error) {
    next(error)
  }
}

export const rejectExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { comments } = req.body

    const expense = await Expense.findByPk(id)

    if (!expense) {
      throw createError('Expense not found', 404)
    }

    await expense.update({
      status: 'rejected',
    })

    // Reject all pending approvals
    await ExpenseApproval.update(
      { status: 'rejected', comments, approved_at: new Date() },
      {
        where: {
          expense_id: id,
          status: 'pending',
        },
      }
    )

    res.json({
      success: true,
      message: 'Expense rejected',
      expense,
    })
  } catch (error) {
    next(error)
  }
}

export const getPendingApprovals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get user's role to determine which approvals they can see
    // For now, return all pending expenses
    const expenses = await Expense.findAll({
      where: {
        status: {
          [Op.in]: ['pending_approval_1', 'pending_approval_2', 'pending_approval_3'],
        },
      },
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'submitter',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'approvals',
        },
      ],
      order: [['expense_date', 'DESC']],
    })

    res.json({
      success: true,
      expenses,
    })
  } catch (error) {
    next(error)
  }
}

