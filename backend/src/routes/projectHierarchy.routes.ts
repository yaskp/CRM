import { Router } from 'express'
import * as hierarchyController from '../controllers/projectHierarchy.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/buildings', hierarchyController.getBuildings)
router.post('/buildings', hierarchyController.createBuilding)

router.get('/floors', hierarchyController.getFloors)
router.post('/floors', hierarchyController.createFloor)

router.get('/zones', hierarchyController.getZones)
router.post('/zones', hierarchyController.createZone)

router.get('/:projectId', hierarchyController.getProjectHierarchy)

export default router
