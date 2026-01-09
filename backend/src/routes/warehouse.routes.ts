import { Router } from 'express'
import {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
} from '../controllers/warehouse.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('warehouses.read'), getWarehouses)
router.post('/', hasPermission('warehouses.create'), createWarehouse)
router.get('/:id', hasPermission('warehouses.read'), getWarehouse)
router.put('/:id', hasPermission('warehouses.update'), updateWarehouse)

export default router

