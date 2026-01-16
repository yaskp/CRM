import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.use(authorize(['Admin'])) // Only admins can manage users

router.get('/', userController.getUsers)
router.get('/:id', userController.getUser)
router.post('/', userController.createUser)
router.put('/:id', userController.updateUser)
router.delete('/:id', userController.deleteUser)

export default router
