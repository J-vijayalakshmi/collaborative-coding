// User interface
export interface User {
  uid: string;
  email: string;
  username: string;
  profilePicture?: string;
  createdAt: Date;
  lastLogin: Date;
}

// Room interface
export interface Room {
  roomId: string;
  roomName: string;
  ownerId: string;
  participants: string[];
  createdAt: Date;
  isActive: boolean;
  programmingLanguage: string;
  interviewMode: boolean;
  interviewerUserId?: string;
  candidateUserId?: string;
}

// Code document interface
export interface CodeDocument {
  content: string;
  lastEditedBy: string;
  updatedAt: Date;
  version: number;
}

// Version history interface
export interface VersionHistory {
  versionNumber: number;
  content: string;
  editedBy: string;
  userName: string;
  timestamp: Date;
  changes?: string;
  description?: string;
}

// Cursor position interface
export interface CursorPosition {
  userId: string;
  userName: string;
  line: number;
  column: number;
  color: string;
  lastUpdated: Date;
}

// Chat message interface
export interface ChatMessage {
  messageId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isSystemMessage: boolean;
}

// API Request/Response types
export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateRoomRequest {
  roomName: string;
  programmingLanguage: string;
  interviewMode?: boolean;
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Extend Express Request to include user
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}
