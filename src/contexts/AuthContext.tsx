import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { getUsuario } from '@/services/firestore'
import type { Usuario } from '@/models/types'

interface AuthContextValue {
  user: User | null
  usuario: Usuario | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setError(null)

      if (firebaseUser) {
        const userProfile = await getUsuario(firebaseUser.uid)
        if (!userProfile) {
          setError('Seu email não está autorizado. Peça ao administrador para liberar seu acesso.')
          await signOut(auth)
          setUsuario(null)
        } else {
          setUsuario(userProfile)
        }
      } else {
        setUsuario(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError('Erro ao fazer login com Google. Tente novamente.')
      console.error(err)
    }
  }

  async function signOutUser() {
    await signOut(auth)
    setUser(null)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ user, usuario, loading, error, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
