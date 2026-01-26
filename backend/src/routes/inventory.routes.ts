import { Router } from 'express'
import * as inventoryController from '../controllers/inventory.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', inventoryController.getInventory)
router.get('/statement', inventoryController.getStockStatement)

export default router
