import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  orderBy,
  type Unsubscribe
} from 'firebase/firestore'
import type { User, Room } from '../types'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

// Auth Functions
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user
  
  // Update profile with display name
  await updateProfile(user, { displayName })
  
  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  })
  
  return user
}

export const signInWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Update last login
  await updateDoc(doc(db, 'users', userCredential.user.uid), {
    lastLoginAt: serverTimestamp(),
  })
  
  return userCredential.user
}

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  
  // Check if user exists in Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  
  if (!userDoc.exists()) {
    // Create new user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    })
  } else {
    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp(),
    })
  }
  
  return user
}

export const logOut = async () => {
  await signOut(auth)
}

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// User Functions
export const getUserData = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists()) {
    return userDoc.data() as User
  }
  return null
}

// Room Functions
export const createRoom = async (roomData: Partial<Room>, userId: string): Promise<string> => {
  const roomRef = doc(collection(db, 'rooms'))
  const roomId = roomRef.id
  
  await setDoc(roomRef, {
    ...roomData,
    id: roomId,
    ownerId: userId,
    participants: [userId],
    createdAt: serverTimestamp(),
    isActive: true,
  })
  
  return roomId
}

export const getRoom = async (roomId: string): Promise<Room | null> => {
  const roomDoc = await getDoc(doc(db, 'rooms', roomId))
  if (roomDoc.exists()) {
    return roomDoc.data() as Room
  }
  return null
}

export const joinRoom = async (roomId: string, userId: string) => {
  await updateDoc(doc(db, 'rooms', roomId), {
    participants: arrayUnion(userId),
  })
}

export const leaveRoom = async (roomId: string, userId: string) => {
  await updateDoc(doc(db, 'rooms', roomId), {
    participants: arrayRemove(userId),
  })
}

export const updateRoomCode = async (roomId: string, code: string, language?: string) => {
  const updateData: Record<string, any> = {
    code,
    lastUpdated: serverTimestamp(),
  }
  
  if (language) {
    updateData.language = language
  }
  
  await updateDoc(doc(db, 'rooms', roomId), updateData)
}

export const subscribeToRoom = (roomId: string, callback: (room: Room | null) => void): Unsubscribe => {
  return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Room)
    } else {
      callback(null)
    }
  })
}

export const getActiveRooms = async (): Promise<Room[]> => {
  const roomsQuery = query(
    collection(db, 'rooms'),
    where('isActive', '==', true),
    where('isPrivate', '==', false)
  )
  const snapshot = await getDocs(roomsQuery)
  return snapshot.docs.map(doc => doc.data() as Room)
}

export const getUserRooms = async (userId: string): Promise<Room[]> => {
  const roomsQuery = query(
    collection(db, 'rooms'),
    where('ownerId', '==', userId)
  )
  const snapshot = await getDocs(roomsQuery)
  return snapshot.docs.map(doc => doc.data() as Room)
}

// Chat Functions
export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  audioData?: string // Base64 encoded audio for voice messages
  audioDuration?: number // Duration in seconds
}

export const sendChatMessage = async (
  roomId: string, 
  userId: string, 
  userName: string, 
  message: string,
  audioData?: string,
  audioDuration?: number
): Promise<string> => {
  const messageRef = doc(collection(db, 'rooms', roomId, 'messages'))
  const messageId = messageRef.id
  
  const messageData: Record<string, unknown> = {
    id: messageId,
    roomId,
    userId,
    userName,
    message,
    timestamp: serverTimestamp(),
  }
  
  if (audioData) {
    messageData.audioData = audioData
    messageData.audioDuration = audioDuration || 0
  }
  
  await setDoc(messageRef, messageData)
  
  return messageId
}

export const subscribeToChatMessages = (
  roomId: string, 
  callback: (messages: ChatMessage[]) => void
): Unsubscribe => {
  const messagesQuery = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc')
  )
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as ChatMessage[]
    callback(messages)
  })
}

// Cursor Position Functions
export interface CursorData {
  oderId: string
  userName: string
  color: string
  line: number
  column: number
  timestamp: Date
}

const CURSOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
]

export const getUserColor = (userId: string): string => {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export const updateCursorPosition = async (
  roomId: string,
  oderId: string,
  userName: string,
  line: number,
  column: number
): Promise<void> => {
  const cursorRef = doc(db, 'rooms', roomId, 'cursors', oderId)
  await setDoc(cursorRef, {
    oderId,
    userName,
    color: getUserColor(oderId),
    line,
    column,
    timestamp: serverTimestamp(),
  })
}

export const removeCursor = async (roomId: string, oderId: string): Promise<void> => {
  try {
    const cursorRef = doc(db, 'rooms', roomId, 'cursors', oderId)
    await setDoc(cursorRef, { removed: true })
  } catch (e) {
    console.error('Error removing cursor:', e)
  }
}

export const subscribeToCursors = (
  roomId: string,
  currentUserId: string,
  callback: (cursors: CursorData[]) => void
): Unsubscribe => {
  return onSnapshot(collection(db, 'rooms', roomId, 'cursors'), (snapshot) => {
    const cursors = snapshot.docs
      .map(doc => doc.data() as CursorData & { removed?: boolean })
      .filter(cursor => cursor.oderId !== currentUserId && !cursor.removed)
    callback(cursors)
  })
}

