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
    <div className="p-4 md:p-8">
      <h1 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl">Relatórios</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select className="h-11 w-full rounded-md border bg-background px-3 sm:w-auto" value={tipo} onChange={(e) => setTipo(e.target.value as RelatorioTipo)}>
          <option value="criancas_por_origem">Crianças por Origem</option>
          <option value="por_contato">Lista por Contato</option>
          <option value="sacolas_faltantes">Sacolas Faltantes</option>
          <option value="presenca">Lista de Presença</option>
          <option value="entregas">Lista de Entregas</option>
        </select>
        {tipo === 'por_contato' && (
          <select className="h-11 w-full rounded-md border bg-background px-3 sm:w-auto" value={contatoSel} onChange={(e) => setContatoSel(e.target.value)}>
            <option value="">Todos os contatos</option>
            {contatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}
        <Button variant="outline" className="h-11 sm:w-auto" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Crianças por Origem */}
      {tipo === 'criancas_por_origem' && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg md:text-xl">Crianças por Origem</CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                const rows: string[][] = [['Origem', 'Fichas', 'Crianças', 'Apadrinhadas', 'Meta']]
                for (const o of campanha.origens) {
                  const fs = fichas.filter((f) => f.status === 'ativa' && f.origem === o.nome)
                  const cs = fs.flatMap((f) => f.criancas)
                  rows.push([o.nome, String(fs.length), String(cs.length), String(cs.filter((c) => c.apadrinhamento).length), String(o.metaCriancas)])
                }
                exportCSV(rows, 'criancas_por_origem.csv')
              }}>
                <FileSpreadsheet className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="hidden overflow-x-auto md:block">
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
            </div>
            <div className="space-y-3 md:hidden">
              {campanha.origens.map((o) => {
                const fs = fichas.filter((f) => f.status === 'ativa' && f.origem === o.nome)
                const cs = fs.flatMap((f) => f.criancas)
                return (
                  <div key={o.nome} className="rounded-lg border p-3">
                    <div className="mb-2 font-semibold">{o.nome}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <ReportField label="Fichas" value={String(fs.length)} />
                      <ReportField label="Crianças" value={String(cs.length)} />
                      <ReportField label="Apadrinhadas" value={String(cs.filter((c) => c.apadrinhamento).length)} />
                      <ReportField label="Meta" value={String(o.metaCriancas)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista por Contato */}
      {tipo === 'por_contato' && (
        <Card>
          <CardHeader className="p-4 md:p-6"><CardTitle className="text-lg md:text-xl">Lista por Contato</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="hidden overflow-x-auto md:block">
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
            </div>
            <div className="space-y-3 md:hidden">
              {criancas
                .filter(({ crianca }) => crianca.apadrinhamento && (!contatoSel || crianca.apadrinhamento.contatoId === contatoSel))
                .map(({ ficha, crianca }) => (
                  <ReportCard key={crianca.idCrianca} id={crianca.idCrianca} title={crianca.nomeCompleto} fields={[
                    ['Responsável', ficha.nomeResponsavel],
                    ['Padrinho', crianca.apadrinhamento?.padrinho || '-'],
                    ['Status', SACOLA_STATUS_LABELS[crianca.apadrinhamento!.status]],
                  ]} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sacolas Faltantes */}
      {tipo === 'sacolas_faltantes' && (
        <Card>
          <CardHeader className="p-4 md:p-6"><CardTitle className="text-lg md:text-xl">Sacolas Faltantes</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="hidden overflow-x-auto md:block">
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
            </div>
            <div className="space-y-3 md:hidden">
              {criancas
                .filter(({ crianca }) => crianca.apadrinhamento && (crianca.apadrinhamento.status === 'pendente' || crianca.apadrinhamento.status === 'faltando_itens'))
                .map(({ crianca }) => (
                  <ReportCard key={crianca.idCrianca} id={crianca.idCrianca} title={crianca.nomeCompleto} fields={[
                    ['Contato', crianca.apadrinhamento?.contatoNome || '-'],
                    ['Padrinho', crianca.apadrinhamento?.padrinho || '-'],
                    ['Observação', crianca.apadrinhamento?.observacaoConferencia || '-'],
                  ]} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Presença */}
      {tipo === 'presenca' && (
        <Card>
          <CardHeader className="p-4 md:p-6"><CardTitle className="text-lg md:text-xl">Lista de Presença</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="hidden overflow-x-auto md:block">
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
            </div>
            <div className="space-y-3 md:hidden">
              {criancas.map(({ ficha, crianca }) => (
                <ReportCard key={crianca.idCrianca} id={crianca.idCrianca} title={crianca.nomeCompleto} fields={[
                  ['Responsável', ficha.nomeResponsavel],
                  ['Presença', crianca.presenteNaEntrada ? 'Presente' : 'Não compareceu'],
                ]} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entregas */}
      {tipo === 'entregas' && (
        <Card>
          <CardHeader className="p-4 md:p-6"><CardTitle className="text-lg md:text-xl">Lista de Entregas de Presentes</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="hidden overflow-x-auto md:block">
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
            </div>
            <div className="space-y-3 md:hidden">
              {criancas.map(({ crianca }) => (
                <ReportCard key={crianca.idCrianca} id={crianca.idCrianca} title={crianca.nomeCompleto} fields={[
                  ['Presença', crianca.presenteNaEntrada ? 'Presente' : 'Não compareceu'],
                  ['Presente', crianca.apadrinhamento?.status === 'entregue_crianca' ? 'Entregue' : 'Não entregue'],
                ]} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words">{value}</div>
    </div>
  )
}

function ReportCard({ id, title, fields }: { id: string; title: string; fields: [string, string][] }) {
  return (
    <article className="rounded-lg border p-3">
      <div className="font-mono text-sm font-bold text-primary">{id}</div>
      <div className="break-words font-semibold">{title}</div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {fields.map(([label, value]) => <ReportField key={label} label={label} value={value} />)}
      </div>
    </article>
  )
}
