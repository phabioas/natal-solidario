import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { calcularIdadeAnosMeses } from '@/lib/idade'
import { Button } from '@/components/ui/button'
import { FichaPadrinhoCard } from '@/pages/admin/FichaPadrinhoPage'
import type { Ficha } from '@/models/types'

export function FichasPadrinhoPrintPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, setFichas)
  }, [campanha])

  const itens = useMemo(() => {
    const busca = (searchParams.get('busca') || '').toLowerCase()
    const origem = searchParams.get('origem') || ''
    const padrinho = searchParams.get('padrinho') || ''
    const contato = searchParams.get('contato') || ''
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.map((crianca) => ({ ficha: f, crianca })))
      .filter(({ ficha, crianca }) => {
        if (!crianca.apadrinhamento) return false
        if (origem && ficha.origem !== origem) return false
        if (padrinho && crianca.apadrinhamento.padrinho !== padrinho) return false
        if (contato && crianca.apadrinhamento.contatoId !== contato) return false
        if (!busca) return true
        return crianca.idCrianca.includes(busca) || crianca.nomeCompleto.toLowerCase().includes(busca) || ficha.nomeResponsavel.toLowerCase().includes(busca) || crianca.apadrinhamento.padrinho.toLowerCase().includes(busca) || crianca.apadrinhamento.contatoNome.toLowerCase().includes(busca)
      })
      .sort((a, b) => a.crianca.idCrianca.localeCompare(b.crianca.idCrianca))
  }, [fichas, searchParams])

  if (!campanha) return null
  const dataFesta = campanha.dataEvento
    ? new Date(campanha.dataEvento.seconds * 1000).toISOString().split('T')[0]
    : `${campanha.ano}-12-13`

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print sticky top-0 z-10 border-b bg-white p-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
          <span className="text-sm text-muted-foreground">{itens.length} ficha(s)</span>
          <Button onClick={() => window.print()} disabled={!itens.length}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
        </div>
      </div>
      <div className="print-area mx-auto max-w-2xl p-4 print:p-0">
        {itens.map(({ crianca }, index) => {
          const idade = crianca.dataNascimento ? calcularIdadeAnosMeses(crianca.dataNascimento, dataFesta) : crianca.idadeTexto || '-'
          return (
            <div key={crianca.idCrianca} className={index < itens.length - 1 ? 'page-break' : ''}>
              <FichaPadrinhoCard crianca={crianca} idade={idade} ano={campanha.ano} campanhaNome={campanha.nome} />
            </div>
          )
        })}
        {!itens.length && <div className="rounded-lg border bg-white p-8 text-center">Nenhuma ficha apadrinhada encontrada para os filtros selecionados.</div>}
      </div>
    </div>
  )
}
