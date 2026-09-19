import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Printer, SlidersHorizontal } from 'lucide-react'
import type { Ficha } from '@/models/types'

export function FichasListPage() {
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [busca, setBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false)
  const [showFiltros, setShowFiltros] = useState(false)

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, (fichas) => {
      fichas.sort((a, b) => a.numeroFicha.localeCompare(b.numeroFicha))
      setFichas(fichas)
    })
  }, [campanha])

  const fichasFiltradas = fichas.filter((f) => {
    if (!mostrarCanceladas && f.status === 'cancelada') return false
    if (filtroOrigem && f.origem !== filtroOrigem) return false
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      f.numeroFicha.includes(termo) ||
      f.nomeResponsavel.toLowerCase().includes(termo) ||
      f.cpfResponsavel.includes(termo) ||
      f.criancas.some((c) => c.nomeCompleto.toLowerCase().includes(termo))
    )
  })

  if (!campanha) return null

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Fichas</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-11 w-11 p-0 md:h-10 md:w-auto md:px-4"
            onClick={() => navigate('/fichas/imprimir')}
            aria-label="Imprimir todas as fichas"
            title="Imprimir todas"
          >
            <Printer className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
            <span className="hidden md:inline">Imprimir Todas</span>
          </Button>
          <Button className="h-11 md:h-10" onClick={() => navigate('/fichas/nova')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ficha
          </Button>
        </div>
      </div>

      {/* Busca e filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar ficha, nome, CPF ou criança..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="relative h-10 w-10 shrink-0 p-0 md:hidden"
            onClick={() => setShowFiltros((value) => !value)}
            aria-label="Mostrar filtros"
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {(filtroOrigem || mostrarCanceladas) && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
        <div className={`${showFiltros ? 'flex' : 'hidden'} flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 md:w-auto"
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
          >
            <option value="">Todas as origens</option>
            {campanha.origens.map((o) => (
              <option key={o.nome} value={o.nome}>{o.nome}</option>
            ))}
          </select>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mostrarCanceladas}
              onChange={(e) => setMostrarCanceladas(e.target.checked)}
            />
            Mostrar canceladas
          </label>
          {(filtroOrigem || mostrarCanceladas) && (
            <Button variant="ghost" size="sm" onClick={() => { setFiltroOrigem(''); setMostrarCanceladas(false) }}>
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
              <th className="p-3 text-left">Ficha</th>
              <th className="p-3 text-left">Mãe</th>
              <th className="p-3 text-left">Origem</th>
              <th className="p-3 text-left">CPF</th>
              <th className="p-3 text-left">Telefone</th>
              <th className="p-3 text-center">Crianças</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fichasFiltradas.map((ficha) => (
              <tr
                key={ficha.id}
                className={`border-t hover:bg-muted/30 ${ficha.status === 'cancelada' ? 'opacity-50' : ''}`}
              >
                <td className="p-3 font-mono font-bold">{ficha.numeroFicha}</td>
                <td className="p-3">{ficha.nomeResponsavel}</td>
                <td className="p-3">{ficha.origem}</td>
                <td className="p-3 font-mono text-xs">{ficha.cpfResponsavel}</td>
                <td className="p-3 font-mono text-xs">{ficha.contatoResponsavel}</td>
                <td className="p-3 text-center">{ficha.criancas.length}</td>
                <td className="p-3">
                  {ficha.status === 'cancelada' ? (
                    <Badge variant="destructive">Cancelada</Badge>
                  ) : (
                    <Badge variant="success">Ativa</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/fichas/imprimir/${ficha.id}`)}
                      aria-label={`Imprimir ficha ${ficha.numeroFicha}`}
                      title="Imprimir ficha"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/fichas/editar/${ficha.id}`)}
                      aria-label={`Editar ficha ${ficha.numeroFicha}`}
                      title="Editar ficha"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="space-y-3 md:hidden">
        {fichasFiltradas.map((ficha) => (
          <article
            key={ficha.id}
            className={`rounded-xl border bg-white p-4 shadow-sm ${ficha.status === 'cancelada' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-sm font-bold text-primary">Ficha {ficha.numeroFicha}</div>
                <h2 className="break-words text-base font-semibold leading-tight">{ficha.nomeResponsavel}</h2>
              </div>
              {ficha.status === 'cancelada' ? (
                <Badge variant="destructive" className="shrink-0">Cancelada</Badge>
              ) : (
                <Badge variant="success" className="shrink-0">Ativa</Badge>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Origem</div>
                <div>{ficha.origem}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Crianças</div>
                <div>{ficha.criancas.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">CPF</div>
                <div className="font-mono">{mascararCpf(ficha.cpfResponsavel)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Telefone</div>
                <div className="font-mono">{ficha.contatoResponsavel || '-'}</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                className="h-11 w-11 p-0"
                onClick={() => navigate(`/fichas/imprimir/${ficha.id}`)}
                aria-label={`Imprimir ficha ${ficha.numeroFicha}`}
                title="Imprimir ficha"
              >
                <Printer className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="h-11 w-11 p-0"
                onClick={() => navigate(`/fichas/editar/${ficha.id}`)}
                aria-label={`Editar ficha ${ficha.numeroFicha}`}
                title="Editar ficha"
              >
                <Pencil className="h-5 w-5" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {fichasFiltradas.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma ficha encontrada.
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        {fichasFiltradas.length} ficha(s) encontrada(s)
      </p>
    </div>
  )
}

function mascararCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11) return cpf ? '***.***.***-**' : '-'
  return `***.***.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}
