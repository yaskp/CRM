import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    getClientGroups,
    createClientGroup,
    updateClientGroup,
    deleteClientGroup,
    getClientProjects
} from '../controllers/client.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Client Group routes
router.get('/groups', getClientGroups)
router.post('/groups', createClientGroup)
router.put('/groups/:id', updateClientGroup)
router.delete('/groups/:id', deleteClientGroup)

// Client routes
router.post('/', createClient)
router.get('/', getClients)
router.get('/:id', getClient)
router.put('/:id', updateClient)
router.delete('/:id', deleteClient)
router.get('/:id/projects', getClientProjects)

export default router
