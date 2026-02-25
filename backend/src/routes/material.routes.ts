import { Router } from 'express'
import {
  createMaterial,
  getMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  importMaterials,
} from '../controllers/material.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('materials.read'), getMaterials)
router.post('/', hasPermission('materials.create'), createMaterial)
router.post('/import', hasPermission('materials.create'), importMaterials)
router.get('/:id', hasPermission('materials.read'), getMaterial)
router.put('/:id', hasPermission('materials.update'), updateMaterial)
router.delete('/:id', hasPermission('materials.update'), deleteMaterial)

export default router

