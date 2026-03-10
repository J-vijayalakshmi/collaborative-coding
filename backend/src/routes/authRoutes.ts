import { Router } from 'express';
import { signup, getCurrentUser, updateLastLogin, updateProfile } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/signup', signup);

// Protected routes (require authentication)
router.get('/user', verifyToken, getCurrentUser);
router.post('/login-update', verifyToken, updateLastLogin);
router.put('/user', verifyToken, updateProfile);

export default router;
