import { useState, useEffect, useMemo } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { subscribeFichas, subscribeContatos } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, FileSpreadsheet } from 'lucide-react'
import type { Ficha, Contato } from '@/models/types'
import { SACOLA_STATUS_LABELS, SACOLA_STATUS_COLORS } from '@/models/types'

type RelatorioTipo = 'criancas_por_origem' | 'por_contato' | 'sacolas_faltantes' | 'presenca' | 'entregas'

export function RelatoriosPage() {
  const { campanha } = useCampanha()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [tipo, setTipo] = useState<RelatorioTipo>('criancas_por_origem')
  const [contatoSel, setContatoSel] = useState('')

  useEffect(() => {
    if (!campanha) return
    const u1 = subscribeFichas(campanha.id, setFichas)
    const u2 = subscribeContatos(campanha.id, setContatos)
    return () => { u1(); u2() }
  }, [campanha])

  const criancas = useMemo(() => {
    return fichas
      .filter((f) => f.status === 'ativa')
      .flatMap((f) => f.criancas.map((c) => ({ ficha: f, crianca: c })))
  }, [fichas])

  if (!campanha) return null

  const exportCSV = (rows: string[][], filename: string) => {
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Relatórios</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <select className="h-10 rounded-md border px-3" value={tipo} onChange={(e) => setTipo(e.target.value as RelatorioTipo)}>
          <option value="criancas_por_origem">Crianças por Origem</option>
          <option value="por_contato">Lista por Contato</option>
          <option value="sacolas_faltantes">Sacolas Faltantes</option>
          <option value="presenca">Lista de Presença</option>
          <option value="entregas">Lista de Entregas</option>
        </select>
        {tipo === 'por_contato' && (
          <select className="h-10 rounded-md border px-3" value={contatoSel} onChange={(e) => setContatoSel(e.target.value)}>
            <option value="">Todos os contatos</option>
            {contatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Crianças por Origem */}
      {tipo === 'criancas_por_origem' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Crianças por Origem</CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                const rows: string[][] = [['Origem', 'Fichas', 'Crianças', 'Apadrinhadas', 'Meta']]
                for (const o of campanha.origens) {
                  const fs = fichas.filter((f) => f.status === 'ativa' && f.origem === o.nome)
                  const cs = fs.flatMap((f) => f.criancas)
                  rows.push([o.nome, String(fs.length), String(cs.length), String(cs.filter((c) => c.apadrinhamento).length), String(o.metaCriancas)])
                }
                exportCSV(rows, 'criancas_por_origem.csv')
              }}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="p-2 text-left">Origem</th><th className="p-2 text-right">Fichas</th><th className="p-2 text-right">Crianças</th><th className="p-2 text-right">Apadrinhadas</th><th className="p-2 text-right">Meta</th></tr>
              </thead>
              <tbody>
                {campanha.origens.map((o) => {
                  const fs = fichas.filter((f) => f.status === 'ativa' && f.origem === o.nome)
                  const cs = fs.flatMap((f) => f.criancas)
                  return (
                    <tr key={o.nome} className="border-t">
                      <td className="p-2 font-medium">{o.nome}</td>
                      <td className="p-2 text-right">{fs.length}</td>
                      <td className="p-2 text-right">{cs.length}</td>
                      <td className="p-2 text-right text-green-600">{cs.filter((c) => c.apadrinhamento).length}</td>
                      <td className="p-2 text-right text-muted-foreground">{o.metaCriancas}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Lista por Contato */}
      {tipo === 'por_contato' && (
        <Card>
          <CardHeader><CardTitle>Lista por Contato</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Criança</th><th className="p-2 text-left">Mãe</th><th className="p-2 text-left">Padrinho</th><th className="p-2 text-left">Status</th></tr>
              </thead>
              <tbody>
                {criancas
                  .filter(({ crianca }) => crianca.apadrinhamento && (!contatoSel || crianca.apadrinhamento.contatoId === contatoSel))
                  .map(({ ficha, crianca }) => (
                    <tr key={crianca.idCrianca} className="border-t">
                      <td className="p-2 font-mono">{crianca.idCrianca}</td>
                      <td className="p-2">{crianca.nomeCompleto}</td>
                      <td className="p-2 text-xs">{ficha.nomeResponsavel}</td>
                      <td className="p-2 text-xs">{crianca.apadrinhamento?.padrinho}</td>
                      <td className="p-2"><Badge className={SACOLA_STATUS_COLORS[crianca.apadrinhamento!.status]}>{SACOLA_STATUS_LABELS[crianca.apadrinhamento!.status]}</Badge></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Sacolas Faltantes */}
      {tipo === 'sacolas_faltantes' && (
        <Card>
          <CardHeader><CardTitle>Sacolas Faltantes</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Criança</th><th className="p-2 text-left">Contato</th><th className="p-2 text-left">Padrinho</th><th className="p-2 text-left">Obs.</th></tr>
              </thead>
              <tbody>
                {criancas
                  .filter(({ crianca }) => crianca.apadrinhamento && (crianca.apadrinhamento.status === 'pendente' || crianca.apadrinhamento.status === 'faltando_itens'))
                  .map(({ crianca }) => (
                    <tr key={crianca.idCrianca} className="border-t">
                      <td className="p-2 font-mono">{crianca.idCrianca}</td>
                      <td className="p-2">{crianca.nomeCompleto}</td>
                      <td className="p-2 text-xs">{crianca.apadrinhamento?.contatoNome}</td>
                      <td className="p-2 text-xs">{crianca.apadrinhamento?.padrinho}</td>
                      <td className="p-2 text-xs text-red-600">{crianca.apadrinhamento?.observacaoConferencia}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Presença */}
      {tipo === 'presenca' && (
        <Card>
          <CardHeader><CardTitle>Lista de Presença</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Criança</th><th className="p-2 text-left">Mãe</th><th className="p-2 text-center">Presente</th></tr>
              </thead>
              <tbody>
                {criancas.map(({ ficha, crianca }) => (
                  <tr key={crianca.idCrianca} className="border-t">
                    <td className="p-2 font-mono">{crianca.idCrianca}</td>
                    <td className="p-2">{crianca.nomeCompleto}</td>
                    <td className="p-2 text-xs">{ficha.nomeResponsavel}</td>
                    <td className="p-2 text-center">{crianca.presenteNaEntrada ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Entregas */}
      {tipo === 'entregas' && (
        <Card>
          <CardHeader><CardTitle>Lista de Entregas de Presentes</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Criança</th><th className="p-2 text-left">Presente</th><th className="p-2 text-left">Status</th></tr>
              </thead>
              <tbody>
                {criancas.map(({ crianca }) => (
                  <tr key={crianca.idCrianca} className="border-t">
                    <td className="p-2 font-mono">{crianca.idCrianca}</td>
                    <td className="p-2">{crianca.nomeCompleto}</td>
                    <td className="p-2">{crianca.presenteNaEntrada ? '✓ Presente' : '✗ Não veio'}</td>
                    <td className="p-2">{crianca.apadrinhamento?.status === 'entregue_crianca' ? '✓ Entregue' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
