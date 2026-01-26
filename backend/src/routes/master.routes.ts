import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { companyBranchController } from '../controllers/companyBranch.controller'
import State from '../models/State'

const router = Router()

router.get('/branches', authenticate, companyBranchController.getBranches)
router.post('/branches', authenticate, companyBranchController.createBranch)
router.put('/branches/:id', authenticate, companyBranchController.updateBranch)
router.delete('/branches/:id', authenticate, companyBranchController.deleteBranch)
router.get('/states', authenticate, async (req, res, next) => {
    try {
        const states = await State.findAll({
            where: { is_active: true },
            order: [['state_code', 'ASC']]
        })
        res.json({ success: true, states })
    } catch (error) {
        next(error)
    }
})

export default router
