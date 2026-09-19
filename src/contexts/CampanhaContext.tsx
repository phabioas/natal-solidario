import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Campanha } from '@/models/types'
import { subscribeCampanhaAtiva } from '@/services/firestore'
import { useAuth } from '@/contexts/AuthContext'

interface CampanhaContextValue {
  campanha: Campanha | null
  loading: boolean
}

const CampanhaContext = createContext<CampanhaContextValue | undefined>(undefined)

export function CampanhaProvider({ children }: { children: ReactNode }) {
  const { user, usuario, loading: authLoading } = useAuth()
  const [campanha, setCampanha] = useState<Campanha | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }
    if (!user || !usuario) {
      setCampanha(null)
      setLoading(false)
      return
    }

    setLoading(true)
    return subscribeCampanhaAtiva(
      (c) => {
        setCampanha(c)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar campanha ativa', error)
        setCampanha(null)
        setLoading(false)
      },
    )
  }, [authLoading, user, usuario])

  return (
    <CampanhaContext.Provider value={{ campanha, loading }}>
      {children}
    </CampanhaContext.Provider>
  )
}

export function useCampanha() {
  const ctx = useContext(CampanhaContext)
  if (!ctx) throw new Error('useCampanha deve ser usado dentro de CampanhaProvider')
  return ctx
}
