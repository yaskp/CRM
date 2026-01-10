import { Router } from 'express'
import {
  createExpense,
  getExpenses,
  getExpense,
  approveExpense,
  rejectExpense,
  getPendingApprovals,
} from '../controllers/expense.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('expenses.read'), getExpenses)
router.post('/', hasPermission('expenses.create'), createExpense)
router.get('/pending-approvals', hasPermission('expenses.approve'), getPendingApprovals)
router.get('/:id', hasPermission('expenses.read'), getExpense)
router.put('/:id/approve', hasPermission('expenses.approve'), approveExpense)
router.put('/:id/reject', hasPermission('expenses.approve'), rejectExpense)

export default router

