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
  const [processando, setProcessando] = useState<string | null>(null)

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const resultados = useMemo(() => {
    if (!busca || busca.length < 2) return []
    const t = busca.toLowerCase().trim()
    const documentoBusca = t.replace(/\D/g, '')
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.map((c) => ({ ficha: f, crianca: c })))
      .filter(({ ficha, crianca }) =>
        crianca.idCrianca.includes(t) ||
        crianca.nomeCompleto.toLowerCase().includes(t) ||
        ficha.nomeResponsavel.toLowerCase().includes(t) ||
        ficha.cpfResponsavel.toLowerCase().includes(t) ||
        (documentoBusca.length >= 2 && ficha.cpfResponsavel.replace(/\D/g, '').includes(documentoBusca))
      )
      .slice(0, 20)
  }, [fichas, busca])

  if (!campanha) return null

  const handleCheckIn = async (ficha: Ficha, crianca: Crianca, presente: boolean) => {
    if (!presente && !confirm(`Desfazer o check-in de ${crianca.nomeCompleto}?`)) return
    setProcessando(crianca.idCrianca)
    try {
      await checkInCrianca(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca, presente)
      toast.success(presente ? `${crianca.nomeCompleto} chegou! ✓` : 'Check-in desfeito')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível atualizar o check-in.')
    } finally {
      setProcessando(null)
    }
  }

  const handleEntregarPresente = async (ficha: Ficha, crianca: Crianca) => {
    if (!crianca.presenteNaEntrada) {
      toast.error('A criança precisa estar presente (check-in) antes de receber o presente')
      return
    }
    if (!crianca.apadrinhamento) {
      toast.error('Esta criança não possui sacola vinculada')
      return
    }
    if (!confirm(`Confirmar a entrega do presente para ${crianca.nomeCompleto}?`)) return
    setProcessando(crianca.idCrianca)
    try {
      await updateSacolaStatus(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca, 'entregue_crianca')
      toast.success(`Presente entregue a ${crianca.nomeCompleto} ✓`)
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível registrar a entrega do presente.')
    } finally {
      setProcessando(null)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl">Check-in da Festa</h1>

      <div className="relative mb-5 md:mb-6">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por ID (001/01), criança, responsável ou documento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 pl-10 text-base md:text-lg"
          autoFocus
        />
      </div>

      {busca.length < 2 && (
        <p className="text-center text-muted-foreground">Digite pelo menos 2 caracteres para buscar</p>
      )}

      <div className="space-y-3">
        {resultados.map(({ ficha, crianca }) => (
          <article key={crianca.idCrianca} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-12 min-w-16 shrink-0 items-center justify-center rounded-lg bg-green-100 px-2 font-mono font-bold text-green-700 md:h-14">
                {crianca.idCrianca}
              </div>
              <div className="min-w-0 flex-1">
                <div className="break-words text-base font-semibold leading-tight md:text-lg">{crianca.nomeCompleto}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {ficha.nomeResponsavel}
                </div>
                <div className="text-xs text-muted-foreground">
                  {ficha.origem} · {crianca.sexo === 'M' ? 'Masculino' : 'Feminino'}
                </div>
              </div>
              {crianca.presenteNaEntrada && (
                <Badge variant="success" className="hidden shrink-0 sm:flex">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Presente
                </Badge>
              )}
            </div>

            {crianca.apadrinhamento && (
              <div className="mt-3 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <div><strong>Padrinho:</strong> {crianca.apadrinhamento.padrinho}</div>
                <div><strong>Contato:</strong> {crianca.apadrinhamento.contatoNome}</div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
              {crianca.presenteNaEntrada ? (
                <>
                  <Badge variant="success" className="sm:hidden">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Presente
                  </Badge>
                  <div className="flex-1" />
                  {crianca.apadrinhamento?.status !== 'entregue_crianca' && crianca.apadrinhamento && (
                    <Button
                      className="h-11"
                      onClick={() => handleEntregarPresente(ficha, crianca)}
                      disabled={processando === crianca.idCrianca}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Entregar presente
                    </Button>
                  )}
                  {crianca.apadrinhamento?.status === 'entregue_crianca' && (
                    <Badge variant="success" className="h-9">Presente entregue ✓</Badge>
                  )}
                  {!crianca.apadrinhamento && (
                    <Badge variant="outline" className="h-9">Sem sacola vinculada</Badge>
                  )}
                  <Button
                    variant="outline"
                    className="h-11 w-11 p-0 text-red-600"
                    onClick={() => handleCheckIn(ficha, crianca, false)}
                    disabled={processando === crianca.idCrianca}
                    aria-label="Desfazer check-in"
                    title="Desfazer check-in"
                  >
                    <Undo2 className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button
                  className="ml-auto h-11 min-w-32"
                  onClick={() => handleCheckIn(ficha, crianca, true)}
                  disabled={processando === crianca.idCrianca}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {processando === crianca.idCrianca ? 'Registrando...' : 'Check-in'}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      {resultados.length === 0 && busca.length >= 2 && (
        <p className="text-center text-muted-foreground">Nenhuma criança encontrada</p>
      )}
    </div>
  )
}
