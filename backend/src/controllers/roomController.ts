import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthenticatedRequest, CreateRoomRequest, Room, ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to get roomId as string
const getRoomIdParam = (params: { roomId?: string }): string => {
  const roomId = params.roomId;
  if (!roomId || typeof roomId !== 'string') {
    throw new Error('Invalid room ID');
  }
  return roomId;
};

/**
 * Create a new coding room
 * POST /api/rooms/create
 */
export const createRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      } as ApiResponse);
      return;
    }

    const { roomName, programmingLanguage, interviewMode }: CreateRoomRequest = req.body;

    // Validate input
    if (!roomName || !programmingLanguage) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Room name and programming language are required'
      } as ApiResponse);
      return;
    }

    // Generate unique room ID
    const roomId = uuidv4().slice(0, 12);

    // Create room data
    const roomData: Omit<Room, 'roomId'> = {
      roomName,
      ownerId: req.user.uid,
      participants: [req.user.uid],
      createdAt: new Date(),
      isActive: true,
      programmingLanguage,
      interviewMode: interviewMode || false
    };

    // If interview mode, set owner as interviewer
    if (interviewMode) {
      roomData.interviewerUserId = req.user.uid;
    }

    // Create room document in Firestore
    await db.collection('rooms').doc(roomId).set(roomData);

    // Initialize empty code document
    await db.collection('rooms').doc(roomId).collection('code').doc('current').set({
      content: '',
      lastEditedBy: req.user.uid,
      updatedAt: new Date(),
      version: 1
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        roomId,
        ...roomData
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * Get room details by ID
 * GET /api/rooms/:roomId
 */
export const getRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      } as ApiResponse);
      return;
    }

    const roomId = req.params.roomId as string;

    if (!roomId) {
      res.status(400).json({
        success: false,
        message: 'Room ID is required'
      } as ApiResponse);
      return;
    }

    // Get room document
    const roomDoc = await db.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
        error: `Room with ID ${roomId} does not exist`
      } as ApiResponse);
      return;
    }

    const roomData = roomDoc.data() as Room;

    // Check if user is participant
    if (!roomData.participants.includes(req.user.uid)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You are not a participant of this room'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Room retrieved successfully',
      data: {
        ...roomData,
        roomId
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * Join an existing room
 * POST /api/rooms/:roomId/join
 */
export const joinRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      } as ApiResponse);
      return;
    }

    const roomId = req.params.roomId as string;

    if (!roomId) {
      res.status(400).json({
        success: false,
        message: 'Room ID is required'
      } as ApiResponse);
      return;
    }

    // Get room document
    const roomDoc = await db.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
        error: `Room with ID ${roomId} does not exist`
      } as ApiResponse);
      return;
    }

    const roomData = roomDoc.data() as Room;

    // Check if room is active
    if (!roomData.isActive) {
      res.status(400).json({
        success: false,
        message: 'Room is closed',
        error: 'This room is no longer active'
      } as ApiResponse);
      return;
    }

    // Check if user is already a participant
    if (roomData.participants.includes(req.user.uid)) {
      res.status(200).json({
        success: true,
        message: 'Already a participant',
        data: {
          ...roomData,
          roomId
        }
      } as ApiResponse);
      return;
    }

    // Add user to participants
    await db.collection('rooms').doc(roomId).update({
      participants: FieldValue.arrayUnion(req.user.uid)
    });

    // If interview mode and no candidate yet, set this user as candidate
    if (roomData.interviewMode && !roomData.candidateUserId) {
      await db.collection('rooms').doc(roomId).update({
        candidateUserId: req.user.uid
      });
    }

    res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      data: {
        ...roomData,
        roomId,
        participants: [...roomData.participants, req.user.uid]
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * Leave a room
 * POST /api/rooms/:roomId/leave
 */
export const leaveRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      } as ApiResponse);
      return;
    }

    const roomId = req.params.roomId as string;

    // Get room document
    const roomDoc = await db.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      } as ApiResponse);
      return;
    }

    const roomData = roomDoc.data() as Room;

    // Check if user is participant
    if (!roomData.participants.includes(req.user.uid)) {
      res.status(400).json({
        success: false,
        message: 'Not a participant'
      } as ApiResponse);
      return;
    }

    // Remove user from participants
    await db.collection('rooms').doc(roomId).update({
      participants: FieldValue.arrayRemove(req.user.uid)
    });

    // Delete cursor position
    await db.collection('rooms').doc(roomId)
      .collection('cursorPositions').doc(req.user.uid).delete();

    res.status(200).json({
      success: true,
      message: 'Left room successfully'
    } as ApiResponse);

  } catch (error: any) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * Close a room (owner only)
 * POST /api/rooms/:roomId/close
 */
export const closeRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      } as ApiResponse);
      return;
    }

    const roomId = req.params.roomId as string;

    // Get room document
    const roomDoc = await db.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      } as ApiResponse);
      return;
    }

    const roomData = roomDoc.data() as Room;

    // Check if user is owner
    if (roomData.ownerId !== req.user.uid) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Only the room owner can close the room'
      } as ApiResponse);
      return;
    }

    // Close the room
    await db.collection('rooms').doc(roomId).update({
      isActive: false
    });

    // Optionally archive the session
    const codeDoc = await db.collection('rooms').doc(roomId).collection('code').doc('current').get();
    const codeData = codeDoc.data();

    await db.collection('sessions').add({
      roomId,
      ownerId: roomData.ownerId,
      participants: roomData.participants,
      programmingLanguage: roomData.programmingLanguage,
      startTime: roomData.createdAt,
      endTime: new Date(),
      finalCode: codeData?.content || ''
    });

    res.status(200).json({
      success: true,
      message: 'Room closed successfully'
    } as ApiResponse);

  } catch (error: any) {
    console.error('Close room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close room',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * List all rooms for current user
 * GET /api/rooms/list
 */
export const listUserRooms = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      } as ApiResponse);
      return;
    }

    // Query rooms where user is a participant
    const roomsSnapshot = await db.collection('rooms')
      .where('participants', 'array-contains', req.user.uid)
      .where('isActive', '==', true)
      .get();

    const rooms: (Room & { roomId: string })[] = [];

    roomsSnapshot.forEach((doc) => {
      const data = doc.data() as Room;
      rooms.push({
        ...data,
        roomId: doc.id
      });
    });

    res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      data: rooms
    } as ApiResponse);

  } catch (error: any) {
    console.error('List rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list rooms',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * Check if room exists (for joining via link)
 * GET /api/rooms/:roomId/exists
 */
export const checkRoomExists = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const roomId = req.params.roomId as string;

    const roomDoc = await db.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      } as ApiResponse);
      return;
    }

    const roomData = roomDoc.data() as Room;

    res.status(200).json({
      success: true,
      message: 'Room exists',
      data: {
        roomId,
        roomName: roomData.roomName,
        isActive: roomData.isActive,
        participantCount: roomData.participants.length
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Check room exists error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check room',
      error: error.message
    } as ApiResponse);
  }
};
