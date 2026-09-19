import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LogOut, Plus, Search, Pencil } from 'lucide-react'
import type { Ficha } from '@/models/types'

export function FichasCadastradorPage() {
  const { usuario, signOutUser } = useAuth()
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!campanha) return
    const unsub = subscribeFichas(campanha.id, (fichas) => {
      // Ordena por número da ficha
      fichas.sort((a, b) => a.numeroFicha.localeCompare(b.numeroFicha))
      setFichas(fichas)
    })
    return unsub
  }, [campanha])

  const fichasFiltradas = fichas.filter((f) => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      f.numeroFicha.includes(termo) ||
      f.nomeResponsavel.toLowerCase().includes(termo)
    )
  })

  const fichasAtivas = fichas.filter((f) => f.status === 'ativa')
  const totalCriancas = fichasAtivas.reduce((sum, f) => sum + f.criancas.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simples */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl text-green-600">★</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cadastro de Fichas</h1>
                <p className="text-sm text-gray-500">Natal Solidário - {campanha?.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-500 sm:block">
                {usuario?.nome || 'Olá'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOutUser()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-4 flex gap-4">
            <div className="rounded-lg bg-green-50 px-4 py-2">
              <span className="text-2xl font-bold text-green-700">{fichasAtivas.length}</span>
              <span className="ml-2 text-sm text-green-600">fichas</span>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <span className="text-2xl font-bold text-blue-700">{totalCriancas}</span>
              <span className="ml-2 text-sm text-blue-600">crianças</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Botão Nova Ficha - grande e visível */}
        <Button
          size="xl"
          className="mb-6 w-full"
          onClick={() => navigate('/nova-ficha')}
        >
          <Plus className="mr-2 h-6 w-6" />
          Cadastrar Nova Ficha
        </Button>

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por número da ficha ou nome da mãe..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de fichas */}
        <div className="space-y-3">
          {fichasFiltradas.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
              {fichas.length === 0
                ? 'Nenhuma ficha cadastrada ainda. Clique em "Cadastrar Nova Ficha" para começar.'
                : 'Nenhuma ficha encontrada na busca.'}
            </div>
          )}
          {fichasFiltradas.map((ficha) => (
            <div
              key={ficha.id}
              className={`rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                ficha.status === 'cancelada' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-lg font-bold text-green-700">
                    {ficha.numeroFicha}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {ficha.nomeResponsavel}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ficha.criancas.length} criança(s) · {ficha.origem}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ficha.status === 'cancelada' && (
                    <Badge variant="destructive">Cancelada</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/editar-ficha/${ficha.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Editar</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
