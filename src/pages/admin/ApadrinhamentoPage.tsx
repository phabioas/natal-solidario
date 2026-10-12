import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas, subscribeContatos, apadrinharCrianca, atualizarApadrinhamento, desApadrinharCrianca } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Heart, X, Link2, Share2, SlidersHorizontal, Pencil, Printer, UserPlus } from 'lucide-react'
import type { Ficha, Contato, Crianca } from '@/models/types'
import { SACOLA_STATUS_LABELS, SACOLA_STATUS_COLORS } from '@/models/types'
import { toast } from 'sonner'
import { PUBLIC_LIST_PATH } from '@/lib/publicacao'

export function ApadrinhamentoPage() {
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const busca = searchParams.get('busca') || ''
  const filtroStatus = (searchParams.get('status') || 'todos') as 'todos' | 'disponiveis' | 'apadrinhadas'
  const filtroOrigem = searchParams.get('origem') || ''
  const filtroPadrinho = searchParams.get('padrinho') || ''
  const filtroContato = searchParams.get('contato') || ''

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value || (key === 'status' && value === 'todos')) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => setSearchParams({}, { replace: true })
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
        if (filtroPadrinho && crianca.apadrinhamento?.padrinho !== filtroPadrinho) return false
        if (filtroContato && crianca.apadrinhamento?.contatoId !== filtroContato) return false
        if (!busca) return true
        const t = busca.toLowerCase()
        return crianca.nomeCompleto.toLowerCase().includes(t) || crianca.idCrianca.includes(t) || ficha.nomeResponsavel.toLowerCase().includes(t) || crianca.apadrinhamento?.padrinho.toLowerCase().includes(t) || crianca.apadrinhamento?.contatoNome.toLowerCase().includes(t)
      })
  }, [fichas, busca, filtroStatus, filtroOrigem, filtroPadrinho, filtroContato])

  const padrinhos = useMemo(() => Array.from(new Set(
    fichas.flatMap((f) => f.criancas.map((c) => c.apadrinhamento?.padrinho).filter((nome): nome is string => !!nome)),
  )).sort((a, b) => a.localeCompare(b, 'pt-BR')), [fichas])

  const contatosOrdenados = useMemo(
    () => [...contatos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [contatos],
  )

  if (!campanha) return null

  const copyPublicLink = async () => {
    const url = `${window.location.origin}${PUBLIC_LIST_PATH}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link público copiado!')
    } catch {
      window.prompt('Copie o link público:', url)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Apadrinhamento</h1>
        <div className="flex items-center gap-2">
        {criancasFlat.some(({ crianca }) => crianca.apadrinhamento) && (
          <Button
            variant="outline"
            className="h-11 w-11 p-0 md:h-10 md:w-auto md:px-4"
            onClick={() => navigate(`/apadrinhamento/imprimir?${searchParams.toString()}`)}
            aria-label="Imprimir fichas apadrinhadas filtradas"
            title="Imprimir fichas filtradas"
          >
            <Printer className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
            <span className="hidden md:inline">Imprimir Filtradas</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={copyPublicLink}
          aria-label="Copiar link público de crianças disponíveis"
          title="Copiar link público"
          className="h-11 w-11 p-0 md:h-10 md:w-auto md:px-4"
        >
          <Link2 className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
          <span className="hidden md:inline">Copiar Link Público</span>
        </Button>
        </div>
      </div>

      {/* Busca e filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar criança, ficha, mãe, padrinho ou contato..." value={busca} onChange={(e) => updateFilter('busca', e.target.value)} className="pl-10" />
          </div>
          <Button
            variant="outline"
            className="relative h-10 w-10 shrink-0 p-0 md:hidden"
            onClick={() => setShowFiltros((value) => !value)}
            aria-label="Mostrar filtros"
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {(busca || filtroStatus !== 'todos' || filtroOrigem || filtroPadrinho || filtroContato) && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
        <div className={`${showFiltros ? 'flex' : 'hidden'} flex-col gap-2 rounded-lg border bg-muted/20 p-3 md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroStatus} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="todos">Todas</option>
            <option value="disponiveis">Disponíveis</option>
            <option value="apadrinhadas">Apadrinhadas</option>
          </select>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroOrigem} onChange={(e) => updateFilter('origem', e.target.value)}>
            <option value="">Todas origens</option>
            {campanha.origens.map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
          </select>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroPadrinho} onChange={(e) => updateFilter('padrinho', e.target.value)}>
            <option value="">Todos padrinhos</option>
            {padrinhos.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
          <select className="h-10 w-full rounded-md border bg-background px-3 md:w-auto" value={filtroContato} onChange={(e) => updateFilter('contato', e.target.value)}>
            <option value="">Todos contatos</option>
            {contatosOrdenados.map((contato) => <option key={contato.id} value={contato.id}>{contato.nome}</option>)}
          </select>
          {(busca || filtroStatus !== 'todos' || filtroOrigem || filtroPadrinho || filtroContato) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
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
                      <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApadrinhar({ ficha, crianca })}
                        aria-label="Editar apadrinhamento"
                        title="Editar apadrinhamento"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/apadrinhamento/ficha/${encodeURIComponent(crianca.idCrianca)}`)}
                        aria-label="Abrir ficha do padrinho"
                        title="Ficha do Padrinho"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      </>
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
                    onClick={() => setShowApadrinhar({ ficha, crianca })}
                    aria-label="Editar apadrinhamento"
                    title="Editar apadrinhamento"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
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
          contatos={contatosOrdenados}
          onClose={() => setShowApadrinhar(null)}
          onNewContact={() => navigate('/contatos')}
          onConfirm={async (padrinho, contatoId, contatoNome) => {
            try {
              if (showApadrinhar.crianca.apadrinhamento) {
                await atualizarApadrinhamento(campanha.id, showApadrinhar.ficha.id, showApadrinhar.ficha.criancas, showApadrinhar.crianca.idCrianca, padrinho, contatoId, contatoNome)
                toast.success('Apadrinhamento atualizado!')
              } else {
                await apadrinharCrianca(campanha.id, showApadrinhar.ficha.id, showApadrinhar.ficha.criancas, showApadrinhar.crianca.idCrianca, padrinho, contatoId, contatoNome)
                toast.success(`${showApadrinhar.crianca.nomeCompleto} apadrinhada!`)
              }
              setShowApadrinhar(null)
            } catch (err) {
              console.error(err)
              toast.error('Erro ao salvar o apadrinhamento. Tente novamente.')
            }
          }}
        />
      )}
    </div>
  )
}

function ApadrinharDialog({
  ficha, crianca, contatos, onClose, onNewContact, onConfirm,
}: {
  ficha: Ficha
  crianca: Crianca
  contatos: Contato[]
  onClose: () => void
  onNewContact: () => void
  onConfirm: (padrinho: string, contatoId: string, contatoNome: string) => Promise<void>
}) {
  const isEdit = !!crianca.apadrinhamento
  const [padrinho, setPadrinho] = useState(crianca.apadrinhamento?.padrinho || '')
  const [contatoId, setContatoId] = useState(crianca.apadrinhamento?.contatoId || '')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
        <h2 className="mb-4 text-xl font-bold">{isEdit ? 'Editar apadrinhamento' : 'Apadrinhar'} {crianca.nomeCompleto}</h2>
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
              {contatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {contatos.length === 0 && (
              <p className="mt-1 text-sm text-red-600">Nenhum contato cadastrado. Cadastre contatos primeiro.</p>
            )}
            <Button type="button" variant="ghost" size="sm" className="mt-2 px-0 text-primary" onClick={onNewContact}>
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar novo contato
            </Button>
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
              {isEdit ? 'Salvar Alterações' : 'Confirmar Apadrinhamento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
