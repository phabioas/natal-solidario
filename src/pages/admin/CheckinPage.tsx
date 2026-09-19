import { useState, useEffect, useMemo } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas, checkInCrianca, updateSacolaStatus } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle2, Undo2, Gift } from 'lucide-react'
import type { Ficha, Crianca } from '@/models/types'
import { toast } from 'sonner'

export function CheckinPage() {
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const resultados = useMemo(() => {
    if (!busca || busca.length < 2) return []
    const t = busca.toLowerCase()
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.map((c) => ({ ficha: f, crianca: c })))
      .filter(({ ficha, crianca }) =>
        crianca.idCrianca.includes(t) ||
        crianca.nomeCompleto.toLowerCase().includes(t) ||
        ficha.nomeResponsavel.toLowerCase().includes(t) ||
        ficha.cpfResponsavel.includes(t)
      )
      .slice(0, 20)
  }, [fichas, busca])

  if (!campanha) return null

  const handleCheckIn = async (ficha: Ficha, crianca: Crianca, presente: boolean) => {
    await checkInCrianca(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca, presente)
    toast.success(presente ? `${crianca.nomeCompleto} chegou! ✓` : `Check-in desfeito`)
  }

  const handleEntregarPresente = async (ficha: Ficha, crianca: Crianca) => {
    if (!crianca.presenteNaEntrada) {
      toast.error('A criança precisa estar presente (check-in) antes de receber o presente')
      return
    }
    await updateSacolaStatus(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca, 'entregue_crianca')
    toast.success(`Presente entregue a ${crianca.nomeCompleto} ✓`)
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Check-in da Festa</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por ID (001/01), criança, responsável ou documento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 text-lg"
          autoFocus
        />
      </div>

      {busca.length < 2 && (
        <p className="text-center text-muted-foreground">Digite pelo menos 2 caracteres para buscar</p>
      )}

      <div className="space-y-3">
        {resultados.map(({ ficha, crianca }) => (
          <div key={crianca.idCrianca} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                  {crianca.idCrianca}
                </div>
                <div>
                  <div className="text-lg font-semibold">{crianca.nomeCompleto}</div>
                  <div className="text-sm text-muted-foreground">
                    Mãe: {ficha.nomeResponsavel} · {ficha.origem} · {crianca.sexo === 'M' ? '♂' : '♀'}
                  </div>
                  {crianca.apadrinhamento && (
                    <div className="text-xs text-muted-foreground">
                      Padrinho: {crianca.apadrinhamento.padrinho} · Contato: {crianca.apadrinhamento.contatoNome}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {crianca.presenteNaEntrada ? (
                  <>
                    <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Presente</Badge>
                    {crianca.apadrinhamento?.status !== 'entregue_crianca' && (
                      <Button size="sm" onClick={() => handleEntregarPresente(ficha, crianca)}>
                        <Gift className="mr-1 h-4 w-4" />
                        Entregar Presente
                      </Button>
                    )}
                    {crianca.apadrinhamento?.status === 'entregue_crianca' && (
                      <Badge variant="success">Presente entregue ✓</Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleCheckIn(ficha, crianca, false)}>
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => handleCheckIn(ficha, crianca, true)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Check-in
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {resultados.length === 0 && busca.length >= 2 && (
        <p className="text-center text-muted-foreground">Nenhuma criança encontrada</p>
      )}
    </div>
  )
}
