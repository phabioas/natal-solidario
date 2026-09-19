import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Campanha } from '@/models/types'
import { subscribeCampanhaAtiva } from '@/services/firestore'

interface CampanhaContextValue {
  campanha: Campanha | null
  loading: boolean
}

const CampanhaContext = createContext<CampanhaContextValue | undefined>(undefined)

export function CampanhaProvider({ children }: { children: ReactNode }) {
  const [campanha, setCampanha] = useState<Campanha | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeCampanhaAtiva((c) => {
      setCampanha(c)
      setLoading(false)
    })
    return unsub
  }, [])

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
