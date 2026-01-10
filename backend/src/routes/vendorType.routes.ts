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
router.get('/vendor-types', getVendorTypes)
router.get('/vendor-types/:id', getVendorTypeById)
router.post('/vendor-types', createVendorType)
router.put('/vendor-types/:id', updateVendorType)
router.delete('/vendor-types/:id', deleteVendorType)

export default router
