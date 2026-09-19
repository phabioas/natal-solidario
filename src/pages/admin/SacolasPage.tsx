import { useState, useEffect, useMemo } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas, updateSacolaStatus } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, AlertCircle, SlidersHorizontal } from 'lucide-react'
import type { Ficha, Crianca, SacolaStatus } from '@/models/types'
import { SACOLA_STATUS_LABELS, SACOLA_STATUS_COLORS } from '@/models/types'
import { toast } from 'sonner'

const STATUS_ORDER: SacolaStatus[] = ['pendente', 'entregue', 'faltando_itens', 'conferida', 'no_salao', 'entregue_crianca']

export function SacolasPage() {
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroContato, setFiltroContato] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [showObs, setShowObs] = useState<{ ficha: Ficha; crianca: Crianca } | null>(null)
  const [obsText, setObsText] = useState('')

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const sacolas = useMemo(() => {
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.filter((c) => c.apadrinhamento).map((c) => ({ ficha: f, crianca: c })))
      .filter(({ crianca }) => {
        const ap = crianca.apadrinhamento!
        if (filtroStatus && ap.status !== filtroStatus) return false
        if (filtroContato && ap.contatoId !== filtroContato) return false
        if (!busca) return true
        const t = busca.toLowerCase()
        return crianca.nomeCompleto.toLowerCase().includes(t) || crianca.idCrianca.includes(t) || ap.padrinho.toLowerCase().includes(t)
      })
  }, [fichas, busca, filtroStatus, filtroContato])

  const contatos = useMemo(() => {
    const map = new Map<string, string>()
    fichas.forEach((f) => f.criancas.forEach((c) => {
      if (c.apadrinhamento) map.set(c.apadrinhamento.contatoId, c.apadrinhamento.contatoNome)
    }))
    return Array.from(map.entries())
  }, [fichas])

  // "O que falta" - sacolas pendentes ou faltando itens, agrupadas por contato
  const faltantes = useMemo(() => {
    const grupos: Record<string, { nome: string; items: { crianca: Crianca; padrinho: string }[] }> = {}
    fichas.filter((f) => f.status === 'ativa').forEach((f) => {
      f.criancas.forEach((c) => {
        if (c.apadrinhamento && (c.apadrinhamento.status === 'pendente' || c.apadrinhamento.status === 'faltando_itens')) {
          const cid = c.apadrinhamento.contatoId
          if (!grupos[cid]) grupos[cid] = { nome: c.apadrinhamento.contatoNome, items: [] }
          grupos[cid].items.push({ crianca: c, padrinho: c.apadrinhamento.padrinho })
        }
      })
    })
    return grupos
  }, [fichas])

  if (!campanha) return null

  const handleStatusChange = async (ficha: Ficha, crianca: Crianca, newStatus: SacolaStatus) => {
    if (newStatus === 'faltando_itens') {
      setObsText(crianca.apadrinhamento?.observacaoConferencia || '')
      setShowObs({ ficha, crianca })
      return
    }
    await updateSacolaStatus(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca, newStatus)
    toast.success(`Status atualizado: ${SACOLA_STATUS_LABELS[newStatus]}`)
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl">Sacolas</h1>

      {/* O que falta - destaque */}
      {Object.keys(faltantes).length > 0 && (
        <div className="mb-6 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            Sacolas faltantes ({Object.values(faltantes).reduce((s, g) => s + g.items.length, 0)})
          </h2>
          <div className="space-y-3">
            {Object.entries(faltantes).map(([cid, grupo]) => (
              <div key={cid} className="rounded-md bg-white p-3">
                <div className="mb-2 font-semibold">{grupo.nome}</div>
                <div className="space-y-1">
                  {grupo.items.map(({ crianca, padrinho }) => (
                    <div key={crianca.idCrianca} className="flex flex-col gap-0.5 border-t py-2 text-sm first:border-0 first:pt-0 sm:flex-row sm:justify-between">
                      <span className="break-words"><strong>{crianca.idCrianca}</strong> - {crianca.nomeCompleto}</span>
                      <span className="shrink-0 text-muted-foreground">Padrinho: {padrinho}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca e filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar criança, ficha ou padrinho..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Button
            variant="outline"
            className="relative h-10 w-10 shrink-0 p-0 md:hidden"
            onClick={() => setShowFiltros((value) => !value)}
            aria-label="Mostrar filtros"
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {(filtroStatus || filtroContato) && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
        <div className={`${showFiltros ? 'flex' : 'hidden'} flex-col gap-2 rounded-lg border bg-muted/20 p-3 md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos status</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{SACOLA_STATUS_LABELS[s]}</option>)}
          </select>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroContato} onChange={(e) => setFiltroContato(e.target.value)}>
            <option value="">Todos contatos</option>
            {contatos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </select>
          {(filtroStatus || filtroContato) && (
            <Button variant="ghost" size="sm" onClick={() => { setFiltroStatus(''); setFiltroContato('') }}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Criança</th>
              <th className="p-3 text-left">Padrinho</th>
              <th className="p-3 text-left">Contato</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Obs.</th>
              <th className="p-3 text-right">Atualizar Status</th>
            </tr>
          </thead>
          <tbody>
            {sacolas.map(({ ficha, crianca }) => (
              <tr key={crianca.idCrianca} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono font-bold">{crianca.idCrianca}</td>
                <td className="p-3 font-medium">{crianca.nomeCompleto}</td>
                <td className="p-3 text-xs">{crianca.apadrinhamento?.padrinho}</td>
                <td className="p-3 text-xs">{crianca.apadrinhamento?.contatoNome}</td>
                <td className="p-3">
                  <Badge className={SACOLA_STATUS_COLORS[crianca.apadrinhamento!.status]}>
                    {SACOLA_STATUS_LABELS[crianca.apadrinhamento!.status]}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{crianca.apadrinhamento?.observacaoConferencia}</td>
                <td className="p-3 text-right">
                  <select
                    className="h-9 rounded-md border px-2 text-xs"
                    value={crianca.apadrinhamento!.status}
                    onChange={(e) => handleStatusChange(ficha, crianca, e.target.value as SacolaStatus)}
                  >
                    {STATUS_ORDER.map((s) => <option key={s} value={s}>{SACOLA_STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="space-y-3 md:hidden">
        {sacolas.map(({ ficha, crianca }) => {
          const apadrinhamento = crianca.apadrinhamento!
          return (
            <article key={crianca.idCrianca} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-bold text-primary">{crianca.idCrianca}</div>
                  <h2 className="break-words text-base font-semibold leading-tight">{crianca.nomeCompleto}</h2>
                </div>
                <Badge className={`${SACOLA_STATUS_COLORS[apadrinhamento.status]} shrink-0`}>
                  {SACOLA_STATUS_LABELS[apadrinhamento.status]}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Padrinho</div>
                  <div className="break-words">{apadrinhamento.padrinho}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Contato</div>
                  <div className="break-words">{apadrinhamento.contatoNome}</div>
                </div>
                {apadrinhamento.observacaoConferencia && (
                  <div className="rounded-md bg-yellow-50 p-2 text-yellow-900 sm:col-span-2">
                    <div className="text-xs font-medium">Observação</div>
                    <div className="break-words">{apadrinhamento.observacaoConferencia}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t pt-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor={`status-${crianca.idCrianca}`}>
                  Atualizar status
                </label>
                <select
                  id={`status-${crianca.idCrianca}`}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  value={apadrinhamento.status}
                  onChange={(e) => handleStatusChange(ficha, crianca, e.target.value as SacolaStatus)}
                >
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{SACOLA_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </article>
          )
        })}
      </div>

      {sacolas.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma sacola encontrada.
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">{sacolas.length} sacola(s)</p>

      {/* Dialog observação para faltando_itens */}
      {showObs && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
            <h2 className="mb-4 text-xl font-bold">Sacola com itens faltantes</h2>
            <p className="mb-4 text-sm">{showObs.crianca.nomeCompleto} ({showObs.crianca.idCrianca})</p>
            <Input
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              placeholder="Ex: Falta calçado tamanho 31"
              autoFocus
            />
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
              <Button variant="outline" className="h-11 flex-1" onClick={() => setShowObs(null)}>Cancelar</Button>
              <Button
                className="h-11 flex-1"
                onClick={async () => {
                  await updateSacolaStatus(campanha.id, showObs.ficha.id, showObs.ficha.criancas, showObs.crianca.idCrianca, 'faltando_itens', obsText)
                  toast.success('Status atualizado: Faltando itens')
                  setShowObs(null)
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
