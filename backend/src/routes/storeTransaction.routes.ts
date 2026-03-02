import { Router } from 'express'
import {
  createGRN,
  createSTN,
  createSRN,
  createConsumption,
  getTransactions,
  getTransaction,
  approveTransaction,
  rejectTransaction,
  getWorkerCategories,
  downloadDPRPDF,
  downloadCreditNotePDF,
  updateStoreTransaction,
  createWorkerCategory
} from '../controllers/storeTransaction.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('store.read'), getTransactions)
router.post('/grn', hasPermission('store.create'), createGRN)
router.post('/stn', hasPermission('store.create'), createSTN)
router.post('/srn', hasPermission('store.create'), createSRN)
router.post('/consumption', hasPermission('store.create'), createConsumption)
router.post('/worker-categories', hasPermission('store.create'), createWorkerCategory)
router.get('/worker-categories', hasPermission('store.read'), getWorkerCategories)
router.get('/:id', hasPermission('store.read'), getTransaction)
router.get('/:id/pdf', hasPermission('store.read'), downloadDPRPDF)
router.get('/:id/credit-note-pdf', hasPermission('store.read'), downloadCreditNotePDF)
router.put('/:id', hasPermission('store.create'), updateStoreTransaction)
router.put('/:id/approve', hasPermission('store.approve'), approveTransaction)
router.put('/:id/reject', hasPermission('store.approve'), rejectTransaction)

export default router

