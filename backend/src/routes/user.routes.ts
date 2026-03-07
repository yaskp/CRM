import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

// Allow all authenticated users to fetch users list (needed for project staff assignment)
router.get('/', userController.getUsers)
router.get('/:id', userController.getUser)

// Only admins can modify users
router.post('/', authorize(['Admin', 'SuperAdmin']), userController.createUser)
router.put('/:id', authorize(['Admin', 'SuperAdmin']), userController.updateUser)
router.delete('/:id', authorize(['Admin', 'SuperAdmin']), userController.deleteUser)

// Password management
router.post('/change-password', userController.changePassword)
router.post('/:id/reset-password', authorize(['Admin', 'SuperAdmin']), userController.resetPassword)

export default router
