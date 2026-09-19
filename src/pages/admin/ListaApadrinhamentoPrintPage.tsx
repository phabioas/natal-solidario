import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Share2 } from 'lucide-react'
import type { Ficha } from '@/models/types'
import { calcularIdade } from '@/lib/idade'

export function ListaApadrinhamentoPrintPage() {
  const navigate = useNavigate()
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const dataFesta = campanha?.dataEvento
    ? new Date(campanha.dataEvento.seconds * 1000).toISOString().split('T')[0]
    : '2026-12-13'

  const disponiveis = useMemo(() => {
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.filter((c) => !c.apadrinhamento).map((c) => ({ ficha: f, crianca: c })))
      .sort((a, b) => a.crianca.nomeCompleto.localeCompare(b.crianca.nomeCompleto))
  }, [fichas])

  const handleShareWhatsApp = () => {
    let text = `*NATAL SOLIDÁRIO GETJ - ${campanha?.ano || ''}*\n\n`
    text += `*Crianças disponíveis para apadrinhamento (${disponiveis.length}):*\n\n`
    for (const { crianca } of disponiveis) {
      const idade = crianca.dataNascimento
        ? calcularIdade(crianca.dataNascimento, dataFesta)
        : crianca.idadeTexto || '-'
      const sexo = crianca.sexo === 'M' ? '♂' : '♀'
      text += `${crianca.idCrianca} - ${crianca.nomeCompleto} - ${sexo} - ${idade}\n`
    }
    text += `\n_Escolha uma criança informando o número da ficha!_ 🎄`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print sticky top-0 z-10 border-b bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
              <Share2 className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <div className="print-area mx-auto max-w-4xl p-4 print:p-0">
        <div className="rounded-lg border-2 border-gray-300 bg-white p-6">
          <div className="mb-4 border-b-2 border-green-600 pb-3 text-center">
            <div className="text-2xl font-bold text-green-700">★ Natal Solidário GETJ</div>
            <div className="text-sm text-gray-600">
              Crianças disponíveis para apadrinhamento - {campanha?.nome}
            </div>
            <div className="text-xs text-gray-500">
              Total: {disponiveis.length} crianças
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-300">
              <tr>
                <th className="p-2 text-left">Ficha</th>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-center">Sexo</th>
                <th className="p-2 text-left">Idade</th>
              </tr>
            </thead>
            <tbody>
              {disponiveis.map(({ crianca }) => {
                const idade = crianca.dataNascimento
                  ? calcularIdade(crianca.dataNascimento, dataFesta)
                  : crianca.idadeTexto || '-'
                return (
                  <tr key={crianca.idCrianca} className="border-b border-gray-200">
                    <td className="p-2 font-mono font-bold">{crianca.idCrianca}</td>
                    <td className="p-2">{crianca.nomeCompleto}</td>
                    <td className="p-2 text-center">{crianca.sexo === 'M' ? '♂ M' : '♀ F'}</td>
                    <td className="p-2">{idade}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
