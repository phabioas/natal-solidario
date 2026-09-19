import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Printer } from 'lucide-react'
import type { Ficha } from '@/models/types'

export function FichasListPage() {
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [busca, setBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false)

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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fichas</h1>
        <Button onClick={() => navigate('/fichas/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ficha
        </Button>
        <Button variant="outline" onClick={() => navigate('/fichas/imprimir')}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Todas
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por ficha, nome, CPF, criança..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3"
          value={filtroOrigem}
          onChange={(e) => setFiltroOrigem(e.target.value)}
        >
          <option value="">Todas as origens</option>
          {campanha.origens.map((o) => (
            <option key={o.nome} value={o.nome}>{o.nome}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mostrarCanceladas}
            onChange={(e) => setMostrarCanceladas(e.target.checked)}
          />
          Mostrar canceladas
        </label>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border">
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
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/fichas/editar/${ficha.id}`)}
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

      <p className="mt-4 text-sm text-muted-foreground">
        {fichasFiltradas.length} ficha(s) encontrada(s)
      </p>
    </div>
  )
}
