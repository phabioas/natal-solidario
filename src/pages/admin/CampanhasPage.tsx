import { useState, useEffect } from 'react'
import { getCampanhas, createCampanha, updateCampanha, ativarCampanha } from '@/services/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Check, Trash2, Pencil, X } from 'lucide-react'
import type { Campanha, Origem } from '@/models/types'
import { toast } from 'sonner'

export function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campanha | null>(null)

  const load = () => getCampanhas().then(setCampanhas)
  useEffect(() => { load() }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Campanhas</h1>
        <Button className="h-11 md:h-10" onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <div className="space-y-4">
        {campanhas.map((c) => (
          <Card key={c.id}>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="break-words text-lg">{c.nome}</CardTitle>
                <div className="flex shrink-0 items-center gap-2">
                  {c.ativa && <Badge variant="success">Ativa</Badge>}
                  <Button
                    variant="ghost"
                    className="h-11 w-11 p-0"
                    onClick={() => { setEditing(c); setShowForm(true) }}
                    aria-label={`Editar ${c.nome}`}
                    title="Editar campanha"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="text-muted-foreground">Ano:</span> {c.ano}</div>
                <div><span className="text-muted-foreground">Origens:</span> {c.origens.length}</div>
                <div><span className="text-muted-foreground">Local:</span> {c.localEvento.nome || '-'}</div>
                <div><span className="text-muted-foreground">Data:</span> {c.dataEvento ? new Date(c.dataEvento.seconds * 1000).toLocaleDateString('pt-BR') : '-'}</div>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {c.origens.map((o) => (
                  <Badge key={o.nome} variant="secondary">
                    {o.nome}: {o.fichaInicio.toString().padStart(3, '0')}–{o.fichaFim.toString().padStart(3, '0')} (meta: {o.metaCriancas})
                  </Badge>
                ))}
              </div>
              {!c.ativa && (
                <Button className="h-11 w-full sm:w-auto" onClick={() => ativarCampanha(c.id).then(load).then(() => toast.success('Campanha ativada'))}>
                  <Check className="mr-2 h-4 w-4" />
                  Ativar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <CampanhaForm
          campanha={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function CampanhaForm({
  campanha,
  onClose,
  onSaved,
}: {
  campanha: Campanha | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!campanha
  const [nome, setNome] = useState(campanha?.nome || '')
  const [ano, setAno] = useState(campanha?.ano || new Date().getFullYear() + 1)
  const [dataEvento, setDataEvento] = useState(
    campanha?.dataEvento
      ? new Date(campanha.dataEvento.seconds * 1000).toISOString().split('T')[0]
      : ''
  )
  const [localNome, setLocalNome] = useState(campanha?.localEvento.nome || '')
  const [localEndereco, setLocalEndereco] = useState(campanha?.localEvento.endereco || '')
  const [localCidade, setLocalCidade] = useState(campanha?.localEvento.cidade || '')
  const [localCep, setLocalCep] = useState(campanha?.localEvento.cep || '')
  const [origens, setOrigens] = useState<Origem[]>(
    campanha?.origens || [
      { nome: 'Canadá', fichaInicio: 1, fichaFim: 99, metaCriancas: 175 },
      { nome: 'Itapark', fichaInicio: 100, fichaFim: 199, metaCriancas: 20 },
      { nome: 'PROVER', fichaInicio: 200, fichaFim: 299, metaCriancas: 20 },
      { nome: 'Amélia', fichaInicio: 300, fichaFim: 399, metaCriancas: 20 },
      { nome: 'Avulsas', fichaInicio: 400, fichaFim: 499, metaCriancas: 15 },
    ]
  )

  const addOrigem = () => setOrigens([...origens, { nome: '', fichaInicio: 0, fichaFim: 0, metaCriancas: 0 }])
  const updateOrigem = (i: number, field: keyof Origem, value: string | number) => {
    const novas = [...origens]
    novas[i] = { ...novas[i], [field]: value }
    setOrigens(novas)
  }
  const removeOrigem = (i: number) => setOrigens(origens.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!nome || !ano) {
      toast.error('Nome e ano são obrigatórios')
      return
    }
    const data = {
      nome,
      ano,
      dataEvento: dataEvento ? new Date(dataEvento) as unknown as Campanha['dataEvento'] : null,
      localEvento: { nome: localNome, endereco: localEndereco, cidade: localCidade, cep: localCep },
      origens,
    }
    if (isEdit && campanha) {
      await updateCampanha(campanha.id, data)
      toast.success('Campanha atualizada')
    } else {
      await createCampanha({ ...data, ativa: true })
      toast.success('Campanha criada e ativada')
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{isEdit ? 'Editar Campanha' : 'Nova Campanha'}</h2>
          <Button variant="ghost" className="h-11 w-11 shrink-0 p-0" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="XIII Natal Solidário 2026" />
            </div>
            <div>
              <Label className="mb-1 block">Ano *</Label>
              <Input type="number" value={ano} onChange={(e) => setAno(parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Data do Evento</Label>
            <Input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Local</Label>
              <Input value={localNome} onChange={(e) => setLocalNome(e.target.value)} placeholder="Centro Recreativo..." />
            </div>
            <div>
              <Label className="mb-1 block">Endereço</Label>
              <Input value={localEndereco} onChange={(e) => setLocalEndereco(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Cidade</Label>
              <Input value={localCidade} onChange={(e) => setLocalCidade(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">CEP</Label>
              <Input value={localCep} onChange={(e) => setLocalCep(e.target.value)} />
            </div>
          </div>

          {/* Origens com labels explicativas */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <Label>Origens (Regiões)</Label>
                <p className="text-xs text-muted-foreground">
                  Cada origem define um grupo de fichas. A numeração identifica a origem automaticamente.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addOrigem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Header */}
            <div className="mb-1 hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:flex">
              <div className="flex-1">Região / Responsável</div>
              <div className="w-24 text-center">Primeira Ficha</div>
              <div className="w-24 text-center">Última Ficha</div>
              <div className="w-24 text-center">Esperado</div>
              <div className="w-10" />
            </div>
            <div className="space-y-2">
              {origens.map((o, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border p-3 sm:flex sm:gap-2 sm:border-0 sm:p-0">
                  <div className="col-span-2 sm:flex-1">
                    <Label className="mb-1 block text-xs sm:hidden">Região / Responsável</Label>
                    <Input placeholder="Ex: Canadá" value={o.nome} onChange={(e) => updateOrigem(i, 'nome', e.target.value)} />
                  </div>
                  <div className="sm:w-24">
                    <Label className="mb-1 block text-xs sm:hidden">Primeira ficha</Label>
                    <Input type="number" placeholder="001" value={o.fichaInicio} onChange={(e) => updateOrigem(i, 'fichaInicio', parseInt(e.target.value))} className="text-center" />
                  </div>
                  <div className="sm:w-24">
                    <Label className="mb-1 block text-xs sm:hidden">Última ficha</Label>
                    <Input type="number" placeholder="099" value={o.fichaFim} onChange={(e) => updateOrigem(i, 'fichaFim', parseInt(e.target.value))} className="text-center" />
                  </div>
                  <div className="sm:w-24">
                    <Label className="mb-1 block text-xs sm:hidden">Esperado</Label>
                    <Input type="number" placeholder="175" value={o.metaCriancas} onChange={(e) => updateOrigem(i, 'metaCriancas', parseInt(e.target.value))} className="text-center" />
                  </div>
                  <div className="flex items-end justify-end sm:w-10 sm:items-center">
                    <Button variant="ghost" onClick={() => removeOrigem(i)} className="h-11 w-11 p-0 text-red-600" aria-label={`Remover origem ${o.nome || i + 1}`} title="Remover origem">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              ℹ️ O "Esperado" é apenas informativo — usado no dashboard como meta. Não bloqueia o cadastro.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="h-11 flex-1" onClick={handleSave}>
              {isEdit ? 'Salvar Alterações' : 'Criar e Ativar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
