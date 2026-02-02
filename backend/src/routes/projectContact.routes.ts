import { Router } from 'express'
import {
    getProjectContacts,
    createProjectContact,
    updateProjectContact,
    deleteProjectContact
} from '../controllers/projectContact.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:projectId', getProjectContacts)
router.post('/:projectId', createProjectContact)
router.put('/:id', updateProjectContact)
router.delete('/:id', deleteProjectContact)

export default router
