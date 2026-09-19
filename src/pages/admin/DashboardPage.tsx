import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderPlus, HeartHandshake, Package, Users, ClipboardCheck } from 'lucide-react'
import type { Ficha } from '@/models/types'
import { SACOLA_STATUS_LABELS, SACOLA_STATUS_COLORS } from '@/models/types'

export function DashboardPage() {
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const [fichas, setFichas] = useState<Ficha[]>([])

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const stats = useMemo(() => {
    const ativas = fichas.filter((f) => f.status === 'ativa')
    const todasCriancas = ativas.flatMap((f) => f.criancas)
    const apadrinhadas = todasCriancas.filter((c) => c.apadrinhamento)
    const naoApadrinhadas = todasCriancas.filter((c) => !c.apadrinhamento)
    const presentes = todasCriancas.filter((c) => c.presenteNaEntrada)

    const porOrigem: Record<string, { total: number; meta: number }> = {}
    for (const origem of campanha?.origens || []) {
      porOrigem[origem.nome] = { total: 0, meta: origem.metaCriancas }
    }
    for (const f of ativas) {
      if (!porOrigem[f.origem]) porOrigem[f.origem] = { total: 0, meta: 0 }
      porOrigem[f.origem].total += f.criancas.length
    }

    const porStatusSacola: Record<string, number> = {}
    for (const c of apadrinhadas) {
      const s = c.apadrinhamento!.status
      porStatusSacola[s] = (porStatusSacola[s] || 0) + 1
    }

    return {
      totalFichas: ativas.length,
      totalCriancas: todasCriancas.length,
      apadrinhadas: apadrinhadas.length,
      naoApadrinhadas: naoApadrinhadas.length,
      presentes: presentes.length,
      porOrigem,
      porStatusSacola,
    }
  }, [fichas, campanha])

  if (!campanha) return null

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
      <p className="mb-5 mt-1 text-sm text-muted-foreground md:mb-8 md:text-base">{campanha.nome}</p>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Fichas Ativas</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl font-bold md:text-3xl">{stats.totalFichas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Total de Crianças</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl font-bold md:text-3xl">{stats.totalCriancas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Apadrinhadas</CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl font-bold text-green-600 md:text-3xl">{stats.apadrinhadas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCriancas > 0 ? Math.round((stats.apadrinhadas / stats.totalCriancas) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Crianças presentes</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl font-bold text-blue-600 md:text-3xl">{stats.presentes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Por Origem */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg">Distribuição por Origem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            {Object.entries(stats.porOrigem).map(([nome, data]) => (
              <div key={nome}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{nome}</span>
                  <span className="text-muted-foreground">
                    {data.total} {data.meta > 0 && `/ ${data.meta}`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{ width: `${data.meta > 0 ? Math.min((data.total / data.meta) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status das Sacolas */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg">Status das Sacolas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {Object.keys(stats.porStatusSacola).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma criança apadrinhada ainda.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.porStatusSacola).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge className={SACOLA_STATUS_COLORS[status as keyof typeof SACOLA_STATUS_COLORS]}>
                      {SACOLA_STATUS_LABELS[status as keyof typeof SACOLA_STATUS_LABELS]}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mt-8">
        <Button className="h-11" onClick={() => navigate('/fichas/nova')}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Nova Ficha
        </Button>
        <Button variant="outline" className="h-11" onClick={() => navigate('/apadrinhamento')}>
          <HeartHandshake className="mr-2 h-4 w-4" />
          Apadrinhamento
        </Button>
        <Button variant="outline" className="h-11" onClick={() => navigate('/sacolas')}>
          <Package className="mr-2 h-4 w-4" />
          Sacolas
        </Button>
      </div>
    </div>
  )
}
