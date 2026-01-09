import { Router } from 'express'
import authRoutes from './auth.routes'
import projectRoutes from './project.routes'
import leadRoutes from './lead.routes'
import quotationRoutes from './quotation.routes'
import workOrderRoutes from './workOrder.routes'
import materialRoutes from './material.routes'
import warehouseRoutes from './warehouse.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)
router.use('/leads', leadRoutes)
router.use('/quotations', quotationRoutes)
router.use('/work-orders', workOrderRoutes)
router.use('/materials', materialRoutes)
router.use('/warehouses', warehouseRoutes)

export default router

