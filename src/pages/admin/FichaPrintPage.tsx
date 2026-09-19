import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import type { Ficha, Crianca } from '@/models/types'
import { calcularIdade } from '@/lib/idade'

export function FichaPrintPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])

  const fichaId = params.fichaId
  const printAll = !fichaId

  useEffect(() => {
    if (!campanha) return
    return subscribeFichas(campanha.id, (all) => {
      all.sort((a, b) => a.numeroFicha.localeCompare(b.numeroFicha))
      if (fichaId) {
        setFichas(all.filter((f) => f.id === fichaId))
      } else {
        setFichas(all.filter((f) => f.status === 'ativa'))
      }
    })
  }, [campanha, fichaId])

  const dataFesta = campanha?.dataEvento
    ? new Date(campanha.dataEvento.seconds * 1000).toISOString().split('T')[0]
    : '2026-12-13'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-10 border-b bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {printAll ? `${fichas.length} fichas` : '1 ficha'}
            </span>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              {printAll ? 'Imprimir Todas (PDF)' : 'Imprimir'}
            </Button>
          </div>
        </div>
      </div>

      {/* Print area */}
      <div className="print-area mx-auto max-w-4xl p-4 print:p-0">
        {fichas.map((ficha, idx) => (
          <div key={ficha.id} className={idx < fichas.length - 1 ? 'page-break' : ''}>
            <FichaPrintCard ficha={ficha} dataFesta={dataFesta} campanhaNome={campanha?.nome || ''} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FichaPrintCard({
  ficha,
  dataFesta,
  campanhaNome,
}: {
  ficha: Ficha
  dataFesta: string
  campanhaNome: string
}) {
  return (
    <div className="mb-4 rounded-lg border-2 border-gray-300 bg-white p-6">
      {/* Header */}
      <div className="mb-4 border-b-2 border-green-600 pb-3 text-center">
        <div className="text-2xl font-bold text-green-700">★ Natal Solidário GETJ</div>
        <div className="text-sm text-gray-600">{campanhaNome}</div>
      </div>

      {/* Ficha number - destaque */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border-2 border-green-600 px-4 py-2">
            <div className="text-xs text-gray-500">FICHA</div>
            <div className="text-3xl font-bold text-green-700">{ficha.numeroFicha}</div>
          </div>
          <div className="rounded-lg border border-gray-300 px-3 py-2">
            <div className="text-xs text-gray-500">ORIGEM</div>
            <div className="text-lg font-semibold">{ficha.origem}</div>
          </div>
        </div>
        {ficha.status === 'cancelada' && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-lg font-bold text-red-600">
            CANCELADA
          </div>
        )}
      </div>

      {/* Dados da Mãe */}
      <div className="mb-4">
        <h2 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold uppercase text-gray-700">
          Dados da Mãe / Responsável
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div><span className="font-semibold">Nome:</span> {ficha.nomeResponsavel}</div>
          <div><span className="font-semibold">CPF:</span> {ficha.cpfResponsavel || '-'}</div>
          <div><span className="font-semibold">Telefone:</span> {ficha.contatoResponsavel || '-'}</div>
          <div><span className="font-semibold">Qtd. Adultos:</span> {ficha.qtdeAdultos}</div>
          {ficha.observacao && (
            <div className="col-span-2"><span className="font-semibold">Obs.:</span> {ficha.observacao}</div>
          )}
        </div>
      </div>

      {/* Crianças */}
      <div>
        <h2 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold uppercase text-gray-700">
          Crianças ({ficha.criancas.length})
        </h2>
        {ficha.criancas.map((c) => (
          <CriancaPrintRow key={c.idCrianca} crianca={c} dataFesta={dataFesta} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-200 pt-2 text-center text-xs text-gray-400">
        Ficha gerada em {new Date().toLocaleDateString('pt-BR')} · {campanhaNome}
      </div>
    </div>
  )
}

function CriancaPrintRow({
  crianca,
  dataFesta,
}: {
  crianca: Crianca
  dataFesta: string
}) {
  const idade = crianca.dataNascimento
    ? calcularIdade(crianca.dataNascimento, dataFesta)
    : crianca.idadeTexto || '-'

  return (
    <div className="mb-3 rounded-md border border-gray-200 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-sm font-bold text-green-700">
          {crianca.idCrianca}
        </span>
        <span className="text-lg font-semibold">{crianca.nomeCompleto}</span>
        <span className="ml-auto text-sm text-gray-500">
          {crianca.sexo === 'M' ? '♂ Masculino' : '♀ Feminino'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div><span className="font-semibold">Idade:</span> {idade}</div>
        <div><span className="font-semibold">Nasc.:</span> {crianca.dataNascimento ? formatDate(crianca.dataNascimento) : '-'}</div>
        <div><span className="font-semibold">Camisa:</span> {crianca.tamCamiseta || '-'}</div>
        <div><span className="font-semibold">Calça:</span> {crianca.tamCalca || '-'}</div>
        <div><span className="font-semibold">Calçado:</span> {crianca.tamCalcado || '-'}</div>
        <div><span className="font-semibold">TEA:</span> {crianca.tea ? 'Sim' : 'Não'}</div>
        {crianca.preferencial && (
          <div><span className="font-semibold">Pref.:</span> {crianca.preferencial}</div>
        )}
        {crianca.observacao && (
          <div className="col-span-2"><span className="font-semibold">Obs.:</span> {crianca.observacao}</div>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}
