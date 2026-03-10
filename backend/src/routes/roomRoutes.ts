import { Router } from 'express';
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  closeRoom,
  listUserRooms,
  checkRoomExists
} from '../controllers/roomController';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// All room routes require authentication
router.post('/create', verifyToken, createRoom);
router.get('/list', verifyToken, listUserRooms);
router.get('/:roomId', verifyToken, getRoom);
router.get('/:roomId/exists', optionalAuth, checkRoomExists);
router.post('/:roomId/join', verifyToken, joinRoom);
router.post('/:roomId/leave', verifyToken, leaveRoom);
router.post('/:roomId/close', verifyToken, closeRoom);

export default router;
