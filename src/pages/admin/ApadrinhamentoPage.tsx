import { useState, useEffect, useMemo } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas, subscribeContatos, apadrinharCrianca, desApadrinharCrianca } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Heart, X } from 'lucide-react'
import type { Ficha, Contato, Crianca } from '@/models/types'
import { SACOLA_STATUS_LABELS, SACOLA_STATUS_COLORS } from '@/models/types'
import { toast } from 'sonner'

export function ApadrinhamentoPage() {
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'disponiveis' | 'apadrinhadas'>('todos')
  const [filtroOrigem, setFiltroOrigem] = useState('')
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
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Apadrinhamento</h1>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar criança, ficha, mãe..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
        <select className="h-10 rounded-md border px-3" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}>
          <option value="todos">Todas</option>
          <option value="disponiveis">Disponíveis</option>
          <option value="apadrinhadas">Apadrinhadas</option>
        </select>
        <select className="h-10 rounded-md border px-3" value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)}>
          <option value="">Todas origens</option>
          {campanha.origens.map((o) => <option key={o.nome} value={o.nome}>{o.nome}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border">
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
                  {crianca.apadrinhamento ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{criancasFlat.length} criança(s)</p>

      {showApadrinhar && (
        <ApadrinharDialog
          ficha={showApadrinhar.ficha}
          crianca={showApadrinhar.crianca}
          contatos={contatos}
          onClose={() => setShowApadrinhar(null)}
          onConfirm={async (padrinho, contatoId, contatoNome) => {
            await apadrinharCrianca(campanha.id, showApadrinhar.ficha.id, showApadrinhar.ficha.criancas, showApadrinhar.crianca.idCrianca, padrinho, contatoId, contatoNome)
            toast.success(`${showApadrinhar.crianca.nomeCompleto} apadrinhada!`)
            setShowApadrinhar(null)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1"
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
