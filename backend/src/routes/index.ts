import { Router } from 'express'
import purchaseOrderRoutes from './purchaseOrder.routes'
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
import userRoutes from './user.routes'
import roleRoutes from './role.routes'
import inventoryRoutes from './inventory.routes'
import vendorTypeRoutes from './vendorType.routes'
import uploadRoutes from './upload.routes'
import workItemTypeRoutes from './workItemType.routes'
import unitRoutes from './unit.routes'
import reportRoutes from './reports'
import clientRoutes from './client.routes'
import annexureRoutes from './annexure.routes'
import projectHierarchyRoutes from './projectHierarchy.routes'
import boqRoutes from './boq.routes'
import masterRoutes from './master.routes'
import budgetRoutes from './budget.routes'
import workTemplateRoutes from './workTemplate.routes'
import financialTransactionRoutes from './financialTransaction.routes'
import projectContactRoutes from './projectContact.routes'

const router = Router()

router.use('/reports', reportRoutes)
router.use('/auth', authRoutes)
router.use('/units', unitRoutes)
router.use('/work-item-types', workItemTypeRoutes)
router.use('/purchase-orders', purchaseOrderRoutes)
router.use('/upload', uploadRoutes)
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
router.use('/vendor-types', vendorTypeRoutes)
router.use('/bar-bending-schedules', barBendingScheduleRoutes)
router.use('/users', userRoutes)
router.use('/roles', roleRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/clients', clientRoutes)
router.use('/annexures', annexureRoutes)
router.use('/project-hierarchy', projectHierarchyRoutes)
router.use('/boqs', boqRoutes)
router.use('/master', masterRoutes)
router.use('/budgets', budgetRoutes)
router.use('/work-templates', workTemplateRoutes)
router.use('/finance', financialTransactionRoutes)
router.use('/project-contacts', projectContactRoutes)

export default router
