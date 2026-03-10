import { Response } from 'express';
import { auth, db } from '../config/firebase';
import { AuthenticatedRequest, SignupRequest, ApiResponse, User } from '../types';

/**
 * Create a new user account
 * POST /api/auth/signup
 */
export const signup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, username }: SignupRequest = req.body;

    // Validate input
    if (!email || !password || !username) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Email, password, and username are required'
      } as ApiResponse);
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password too short',
        error: 'Password must be at least 6 characters'
      } as ApiResponse);
      return;
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username
    });

    // Create user document in Firestore
    const userData: Omit<User, 'uid'> = {
      email,
      username,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        username
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Signup error:', error);

    if (error.code === 'auth/email-already-exists') {
      res.status(409).json({
        success: false,
        message: 'Email already in use',
        error: 'An account with this email already exists'
      } as ApiResponse);
      return;
    }

    if (error.code === 'auth/invalid-email') {
      res.status(400).json({
        success: false,
        message: 'Invalid email',
        error: 'Please provide a valid email address'
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message || 'Internal server error'
    } as ApiResponse);
  }
};

/**
 * Get current user info
 * GET /api/auth/user
 */
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
        error: 'User not found in request'
      } as ApiResponse);
      return;
    }

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User document does not exist'
      } as ApiResponse);
      return;
    }

    const userData = userDoc.data() as User;

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        uid: req.user.uid,
        email: userData.email,
        username: userData.username,
        profilePicture: userData.profilePicture,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message || 'Internal server error'
    } as ApiResponse);
  }
};

/**
 * Update user's last login timestamp
 * POST /api/auth/login-update
 */
export const updateLastLogin = async (
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

    // Update last login timestamp
    await db.collection('users').doc(req.user.uid).update({
      lastLogin: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Last login updated'
    } as ApiResponse);

  } catch (error: any) {
    console.error('Update last login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update last login',
      error: error.message
    } as ApiResponse);
  }
};

/**
 * Update user profile
 * PUT /api/auth/user
 */
export const updateProfile = async (
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

    const { username, profilePicture } = req.body;

    const updateData: Partial<User> = {};
    if (username) updateData.username = username;
    if (profilePicture) updateData.profilePicture = profilePicture;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update'
      } as ApiResponse);
      return;
    }

    // Update Firestore document
    await db.collection('users').doc(req.user.uid).update(updateData);

    // Update Firebase Auth display name if username changed
    if (username) {
      await auth.updateUser(req.user.uid, { displayName: username });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updateData
    } as ApiResponse);

  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    } as ApiResponse);
  }
};
