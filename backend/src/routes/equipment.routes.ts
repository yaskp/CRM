import { Router } from 'express'
import {
  createEquipment,
  getEquipment,
  createEquipmentRental,
  getEquipmentRentals,
  reportEquipmentBreakdown,
  getBreakdownsByRental,
  getEquipmentById,
  updateEquipment,
} from '../controllers/equipment.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('equipment.read'), getEquipment)
router.post('/', hasPermission('equipment.create'), createEquipment)
router.post('/rentals', hasPermission('equipment.create'), createEquipmentRental)
router.get('/rentals', hasPermission('equipment.read'), getEquipmentRentals)
router.get('/rentals/:id/breakdowns', hasPermission('equipment.read'), getBreakdownsByRental)
router.post('/breakdowns', hasPermission('equipment.update'), reportEquipmentBreakdown)

// Dynamic routes must come last
router.get('/:id', hasPermission('equipment.read'), getEquipmentById)
router.put('/:id', hasPermission('equipment.update'), updateEquipment)

export default router

