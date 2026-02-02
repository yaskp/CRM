import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import * as financialTransactionController from '../controllers/financialTransaction.controller'

const router = Router()

router.use(authenticate)

router.post('/', financialTransactionController.createFinancialTransaction)
router.get('/', financialTransactionController.getFinancialTransactions)
router.get('/:id', financialTransactionController.getTransactionDetail)

export default router
