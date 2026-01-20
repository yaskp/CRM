import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    getClientProjects
} from '../controllers/client.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Client routes
router.post('/', createClient)
router.get('/', getClients)
router.get('/:id', getClient)
router.put('/:id', updateClient)
router.delete('/:id', deleteClient)
router.get('/:id/projects', getClientProjects)

export default router
