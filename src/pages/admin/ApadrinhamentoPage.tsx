import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas, subscribeContatos, apadrinharCrianca, desApadrinharCrianca } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Heart, X, FileText, Share2, SlidersHorizontal } from 'lucide-react'
import type { Ficha, Contato, Crianca } from '@/models/types'
import { SACOLA_STATUS_LABELS, SACOLA_STATUS_COLORS } from '@/models/types'
import { toast } from 'sonner'

export function ApadrinhamentoPage() {
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'disponiveis' | 'apadrinhadas'>('todos')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [showApadrinhar, setShowApadrinhar] = useState<{ ficha: Ficha; crianca: Crianca } | null>(null)

  useEffect(() => {
    if (!campanha) return
    const unsub1 = subscribeFichas(campanha.id, setFichas)
    const unsub2 = subscribeContatos(campanha.id, setContatos)
    return () => { unsub1(); unsub2() }
  }, [campanha])

  const criancasFlat = useMemo(() => {
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.map((c) => ({ ficha: f, crianca: c })))
      .filter(({ ficha, crianca }) => {
        if (filtroOrigem && ficha.origem !== filtroOrigem) return false
        if (filtroStatus === 'disponiveis' && crianca.apadrinhamento) return false
        if (filtroStatus === 'apadrinhadas' && !crianca.apadrinhamento) return false
        if (!busca) return true
        const t = busca.toLowerCase()
        return crianca.nomeCompleto.toLowerCase().includes(t) || crianca.idCrianca.includes(t) || ficha.nomeResponsavel.toLowerCase().includes(t)
      })
  }, [fichas, busca, filtroStatus, filtroOrigem])

  if (!campanha) return null

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Apadrinhamento</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/apadrinhamento/lista')}
          aria-label="Abrir lista de crianças disponíveis"
          title="Lista de disponíveis"
          className="h-11 w-11 p-0 md:h-10 md:w-auto md:px-4"
        >
          <FileText className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
          <span className="hidden md:inline">Lista de Disponíveis (WhatsApp)</span>
        </Button>
      </div>

      {/* Busca e filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar criança, ficha, mãe..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Button
            variant="outline"
            className="relative h-10 w-10 shrink-0 p-0 md:hidden"
            onClick={() => setShowFiltros((value) => !value)}
            aria-label="Mostrar filtros"
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {(filtroStatus !== 'todos' || filtroOrigem) && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
        <div className={`${showFiltros ? 'flex' : 'hidden'} flex-col gap-2 rounded-lg border bg-muted/20 p-3 md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}>
            <option value="todos">Todas</option>
            <option value="disponiveis">Disponíveis</option>
            <option value="apadrinhadas">Apadrinhadas</option>
          </select>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)}>
            <option value="">Todas origens</option>
            {campanha.origens.map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
          </select>
          {(filtroStatus !== 'todos' || filtroOrigem) && (
            <Button variant="ghost" size="sm" onClick={() => { setFiltroStatus('todos'); setFiltroOrigem('') }}>
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
              <th className="p-3 text-left">Sexo</th>
              <th className="p-3 text-left">Origem</th>
              <th className="p-3 text-left">Mãe</th>
              <th className="p-3 text-left">Padrinho</th>
              <th className="p-3 text-left">Contato</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {criancasFlat.map(({ ficha, crianca }) => (
              <tr key={crianca.idCrianca} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono font-bold">{crianca.idCrianca}</td>
                <td className="p-3 font-medium">{crianca.nomeCompleto}</td>
                <td className="p-3">{crianca.sexo === 'M' ? '♂' : '♀'}</td>
                <td className="p-3">{ficha.origem}</td>
                <td className="p-3 text-xs">{ficha.nomeResponsavel}</td>
                <td className="p-3 text-xs">{crianca.apadrinhamento?.padrinho || '-'}</td>
                <td className="p-3 text-xs">{crianca.apadrinhamento?.contatoNome || '-'}</td>
                <td className="p-3">
                  {crianca.apadrinhamento ? (
                    <Badge className={SACOLA_STATUS_COLORS[crianca.apadrinhamento.status]}>
                      {SACOLA_STATUS_LABELS[crianca.apadrinhamento.status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Disponível</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {crianca.apadrinhamento && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/apadrinhamento/ficha/${encodeURIComponent(crianca.idCrianca)}`)}
                        aria-label="Abrir ficha do padrinho"
                        title="Ficha do Padrinho"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    {crianca.apadrinhamento ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        aria-label="Desfazer apadrinhamento"
                        title="Desfazer apadrinhamento"
                        onClick={() => {
                          if (confirm(`Desfazer apadrinhamento de ${crianca.nomeCompleto}?`)) {
                            desApadrinharCrianca(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca)
                              .then(() => toast.success('Apadrinhamento desfeito'))
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApadrinhar({ ficha, crianca })}
                      >
                        <Heart className="mr-1 h-4 w-4" />
                        Apadrinhar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="space-y-3 md:hidden">
        {criancasFlat.map(({ ficha, crianca }) => (
          <article key={crianca.idCrianca} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-sm font-bold text-primary">{crianca.idCrianca}</div>
                <h2 className="break-words text-base font-semibold leading-tight">{crianca.nomeCompleto}</h2>
              </div>
              {crianca.apadrinhamento ? (
                <Badge className={`${SACOLA_STATUS_COLORS[crianca.apadrinhamento.status]} shrink-0`}>
                  {SACOLA_STATUS_LABELS[crianca.apadrinhamento.status]}
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0">Disponível</Badge>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Sexo</div>
                <div>{crianca.sexo === 'M' ? 'Masculino' : 'Feminino'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Origem</div>
                <div>{ficha.origem}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Responsável</div>
                <div className="break-words">{ficha.nomeResponsavel}</div>
              </div>
              {crianca.apadrinhamento && (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground">Padrinho</div>
                    <div className="break-words">{crianca.apadrinhamento.padrinho}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Contato</div>
                    <div className="break-words">{crianca.apadrinhamento.contatoNome}</div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
              {crianca.apadrinhamento ? (
                <>
                  <Button
                    variant="outline"
                    className="h-11 w-11 p-0"
                    onClick={() => navigate(`/apadrinhamento/ficha/${encodeURIComponent(crianca.idCrianca)}`)}
                    aria-label="Abrir ficha do padrinho"
                    title="Ficha do padrinho"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-11 p-0 text-red-600"
                    onClick={() => {
                      if (confirm(`Desfazer apadrinhamento de ${crianca.nomeCompleto}?`)) {
                        desApadrinharCrianca(campanha.id, ficha.id, ficha.criancas, crianca.idCrianca)
                          .then(() => toast.success('Apadrinhamento desfeito'))
                      }
                    }}
                    aria-label="Desfazer apadrinhamento"
                    title="Desfazer apadrinhamento"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button className="h-11" onClick={() => setShowApadrinhar({ ficha, crianca })}>
                  <Heart className="mr-2 h-4 w-4" />
                  Apadrinhar
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      {criancasFlat.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma criança encontrada.
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">{criancasFlat.length} criança(s)</p>

      {showApadrinhar && (
        <ApadrinharDialog
          ficha={showApadrinhar.ficha}
          crianca={showApadrinhar.crianca}
          contatos={contatos}
          onClose={() => setShowApadrinhar(null)}
          onConfirm={async (padrinho, contatoId, contatoNome) => {
            try {
              await apadrinharCrianca(campanha.id, showApadrinhar.ficha.id, showApadrinhar.ficha.criancas, showApadrinhar.crianca.idCrianca, padrinho, contatoId, contatoNome)
              toast.success(`${showApadrinhar.crianca.nomeCompleto} apadrinhada!`)
              setShowApadrinhar(null)
            } catch (err) {
              console.error(err)
              toast.error('Erro ao apadrinhar. Tente novamente.')
            }
          }}
        />
      )}
    </div>
  )
}

function ApadrinharDialog({
  ficha, crianca, contatos, onClose, onConfirm,
}: {
  ficha: Ficha
  crianca: Crianca
  contatos: Contato[]
  onClose: () => void
  onConfirm: (padrinho: string, contatoId: string, contatoNome: string) => Promise<void>
}) {
  const [padrinho, setPadrinho] = useState('')
  const [contatoId, setContatoId] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
        <h2 className="mb-4 text-xl font-bold">Apadrinhar {crianca.nomeCompleto}</h2>
        <p className="mb-4 text-sm text-muted-foreground">Ficha {ficha.numeroFicha} · ID {crianca.idCrianca}</p>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Nome do Padrinho *</Label>
            <Input value={padrinho} onChange={(e) => setPadrinho(e.target.value)} placeholder="Nome do padrinho" />
          </div>
          <div>
            <Label className="mb-1 block">Contato (Voluntário GETJ) *</Label>
            <select className="h-10 w-full rounded-md border px-3" value={contatoId} onChange={(e) => setContatoId(e.target.value)}>
              <option value="">Selecione...</option>
              {contatos.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>)}
            </select>
            {contatos.length === 0 && (
              <p className="mt-1 text-sm text-red-600">Nenhum contato cadastrado. Cadastre contatos primeiro.</p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="h-11 flex-1"
              disabled={!padrinho || !contatoId}
              onClick={() => {
                const contato = contatos.find((c) => c.id === contatoId)!
                onConfirm(padrinho, contatoId, contato.nome)
              }}
            >
              Confirmar Apadrinhamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
