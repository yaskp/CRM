import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    getVendorTypes,
    getVendorTypeById,
    createVendorType,
    updateVendorType,
    deleteVendorType,
} from '../controllers/vendorType.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Vendor type routes
router.get('/', getVendorTypes)
router.get('/:id', getVendorTypeById)
router.post('/', createVendorType)
router.put('/:id', updateVendorType)
router.delete('/:id', deleteVendorType)

export default router
