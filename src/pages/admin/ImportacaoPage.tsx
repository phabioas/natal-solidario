import { useState, useRef } from 'react'
import { useCampanha } from '@/contexts/CampanhaContext'
import { createFicha, getFichas } from '@/services/firestore'
import { derivarOrigem, gerarIdCrianca, type Crianca, type Sexo } from '@/models/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

interface PreviewRow {
  numeroFicha: string
  nomeResponsavel: string
  cpfResponsavel: string
  contatoResponsavel: string
  origem: string
  qtdeAdultos: number
  criancas: Crianca[]
  warnings: string[]
}

export function ImportacaoPage() {
  const { campanha } = useCampanha()
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!campanha) return null

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })

      // Procura aba CRIANCA ou MAE
      const sheetName = wb.SheetNames.find((n) => n.toUpperCase().includes('CRIANCA')) || wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: true })

      // Agrupa por ficha
      const grupos: Record<string, PreviewRow> = {}

      for (const row of data) {
        const ficha = String(row['FICHA'] || row['ficha'] || '').trim()
        if (!ficha || ficha === '0') continue

        const nomeMae = String(row['MÃE'] || row['MAE'] || row['nome_responsavel'] || '').trim()
        const cpf = String(row['DOCUMENTO'] || row['cpf_responsavel'] || '').trim()
        const telefone = String(row['CONTATO'] || row['contato_responsavel'] || '').trim()
        const nomeCrianca = String(row['NOME'] || row['nome_crianca'] || '').trim()
        if (!nomeCrianca) continue

        if (!grupos[ficha]) {
          const num = parseInt(ficha)
          grupos[ficha] = {
            numeroFicha: ficha.padStart(3, '0'),
            nomeResponsavel: nomeMae,
            cpfResponsavel: cpf,
            contatoResponsavel: telefone,
            origem: derivarOrigem(num, campanha.origens),
            qtdeAdultos: 1,
            criancas: [],
            warnings: [],
          }
        }

        // Dados da criança
        const sexoRaw = String(row['SEXO'] || row['sexo_crianca'] || 'M').trim().toUpperCase()
        const sexo: Sexo = sexoRaw.startsWith('M') ? 'M' : 'F'
        const nascimento = row['NASCIMENTO'] || row['data_nascimento_crianca']
        let dataNasc: string | null = null
        let idadeTexto: string | null = null
        if (nascimento instanceof Date) {
          dataNasc = nascimento.toISOString().split('T')[0]
        } else if (typeof nascimento === 'number') {
          // Excel serial date
          const date = XLSX.SSF ? new Date((nascimento - 25569) * 86400 * 1000) : null
          if (date) dataNasc = date.toISOString().split('T')[0]
        } else if (nascimento) {
          dataNasc = String(nascimento)
        }
        const idade = row['IDADE'] || row['idade']
        if (!dataNasc && idade) idadeTexto = String(idade)

        const crianca: Crianca = {
          idCrianca: '',
          nomeCompleto: nomeCrianca,
          sexo,
          dataNascimento: dataNasc,
          idadeTexto,
          tamCamiseta: String(row['CAMISA'] || row['tam_camiseta_crianca'] || ''),
          tamCalca: String(row['CALÇA'] || row['CALCA'] || row['tam_calca_crianca'] || ''),
          tamCalcado: String(row['CALÇADO'] || row['CALCADO'] || row['tam_calcado_crianca'] || ''),
          tea: String(row['OBSERVAÇÃO'] || row['OBSERVACAO'] || '').toUpperCase().includes('AUT') ||
               String(row['autismo_crianca'] || '').toUpperCase() === 'SIM',
          observacao: String(row['OBSERVAÇÃO'] || row['OBSERVACAO'] || ''),
          preferencial: String(row['PREFERENCIAL'] || ''),
          observacao2: String(row['OBSERVAÇÃO2'] || row['OBSERVACAO2'] || ''),
          apadrinhamento: null,
          presenteNaEntrada: false,
        }
        grupos[ficha].criancas.push(crianca)
      }

      // Gera IDs das crianças
      const rows = Object.values(grupos)
      for (const r of rows) {
        r.criancas.forEach((c, i) => {
          c.idCrianca = gerarIdCrianca(r.numeroFicha, i + 1)
        })
      }

      setPreview(rows)
      toast.success(`${rows.length} fichas encontradas na planilha`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao ler planilha. Verifique o formato.')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setImported(0)

    // Verifica duplicatas
    const existentes = await getFichas(campanha.id)
    const existenteSet = new Set(existentes.map((f) => f.numeroFicha))

    for (const row of preview) {
      if (existenteSet.has(row.numeroFicha)) {
        toast.warning(`Ficha ${row.numeroFicha} já existe, pulando...`)
        continue
      }
      await createFicha(campanha.id, {
        numeroFicha: row.numeroFicha,
        nomeResponsavel: row.nomeResponsavel.toUpperCase(),
        cpfResponsavel: row.cpfResponsavel,
        contatoResponsavel: row.contatoResponsavel,
        origem: row.origem,
        qtdeAdultos: row.qtdeAdultos,
        qtdeCriancas: row.criancas.length,
        observacao: '',
        status: 'ativa',
        motivoCancelamento: null,
        dataCancelamento: null,
        criancas: row.criancas,
      })
      setImported((n) => n + 1)
    }

    setImporting(false)
    toast.success(`Importação concluída! ${imported} fichas importadas.`)
    setPreview([])
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Importação</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Importar Fichas de Planilha</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um arquivo Excel (.xlsx) ou CSV. O sistema lê a aba "CRIANCA" e importa as fichas para a campanha <strong>{campanha.nome}</strong>.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <Button onClick={() => fileRef.current?.click()} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Selecionar Arquivo
          </Button>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview: {preview.length} fichas</CardTitle>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? `Importando... (${imported}/${preview.length})` : 'Confirmar Importação'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Ficha</th>
                    <th className="p-2 text-left">Mãe</th>
                    <th className="p-2 text-left">Origem</th>
                    <th className="p-2 text-center">Crianças</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr key={r.numeroFicha} className="border-t">
                      <td className="p-2 font-mono font-bold">{r.numeroFicha}</td>
                      <td className="p-2">{r.nomeResponsavel}</td>
                      <td className="p-2">{r.origem}</td>
                      <td className="p-2 text-center">{r.criancas.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
