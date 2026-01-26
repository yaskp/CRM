import { Router } from 'express'
import {
    getBudgetHeads,
    createBudgetHead,
    getProjectBudget,
    updateProjectBudget,
    getBudgetAnalysis
} from '../controllers/budget.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/heads', getBudgetHeads)
router.post('/heads', createBudgetHead)

router.get('/projects/:projectId', getProjectBudget)
router.post('/projects/:projectId', updateProjectBudget)

router.get('/projects/:projectId/analysis', getBudgetAnalysis)

export default router
