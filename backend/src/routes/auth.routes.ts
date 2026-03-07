import { Router } from 'express'
import {
  register,
  login,
  getMe,
  refreshToken,
  logout,
} from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticate, getMe)
router.post('/refresh', authenticate, refreshToken)
router.post('/logout', authenticate, logout)

export default router

