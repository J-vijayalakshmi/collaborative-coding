import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User as FirebaseUser } from 'firebase/auth'
import { 
  onAuthChange, 
  signUpWithEmail, 
  signInWithEmail, 
  signInWithGoogle, 
  logOut,
  getUserData 
} from '../services/firebase'
import type { User } from '../types'

interface AuthContextType {
  user: FirebaseUser | null
  userData: User | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInGoogle: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const data = await getUserData(firebaseUser.uid)
        setUserData(data)
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null)
      setLoading(true)
      await signUpWithEmail(email, password, displayName)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      await signInWithEmail(email, password)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      await signInWithGoogle()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await logOut()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log out'
      setError(errorMessage)
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        signUp,
        signIn,
        signInGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
