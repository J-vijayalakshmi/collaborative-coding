import { Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware to verify Firebase ID token
 * Extracts user info and attaches to request object
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
        error: 'Missing or invalid Authorization header'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token format',
        error: 'Token is empty'
      });
      return;
    }

    // Verify the token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || ''
    };

    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);

    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Please refresh your token'
      });
      return;
    }

    if (error.code === 'auth/argument-error') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token format is invalid'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: error.message || 'Token verification failed'
    });
  }
};

/**
 * Optional auth middleware
 * Doesn't fail if no token, but attaches user if token exists
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (token) {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || ''
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};
