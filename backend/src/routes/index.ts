import { Router } from 'express'
import authRoutes from './auth.routes'
import projectRoutes from './project.routes'
import leadRoutes from './lead.routes'
import quotationRoutes from './quotation.routes'
import workOrderRoutes from './workOrder.routes'
import materialRoutes from './material.routes'
import warehouseRoutes from './warehouse.routes'
import storeTransactionRoutes from './storeTransaction.routes'
import materialRequisitionRoutes from './materialRequisition.routes'
import dprRoutes from './dpr.routes'
import equipmentRoutes from './equipment.routes'
import expenseRoutes from './expense.routes'
import drawingRoutes from './drawing.routes'
import vendorRoutes from './vendor.routes'
import barBendingScheduleRoutes from './barBendingSchedule.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)
router.use('/leads', leadRoutes)
router.use('/quotations', quotationRoutes)
router.use('/work-orders', workOrderRoutes)
router.use('/materials', materialRoutes)
router.use('/warehouses', warehouseRoutes)
router.use('/store', storeTransactionRoutes)
router.use('/requisitions', materialRequisitionRoutes)
router.use('/reports/dpr', dprRoutes)
router.use('/equipment', equipmentRoutes)
router.use('/expenses', expenseRoutes)
router.use('/drawings', drawingRoutes)
router.use('/vendors', vendorRoutes)
router.use('/bar-bending-schedules', barBendingScheduleRoutes)

export default router

