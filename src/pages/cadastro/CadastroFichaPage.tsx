import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCampanha } from '@/contexts/CampanhaContext'
import {
  createFicha,
  updateFicha,
  cancelarFicha,
  getFicha,
  proximoNumeroFicha,
} from '@/services/firestore'
import { derivarOrigem, gerarIdCrianca, type Crianca, type Ficha, type Sexo } from '@/models/types'
import { calcularIdade } from '@/lib/idade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Ban,
  Baby,
} from 'lucide-react'
import { toast } from 'sonner'

// Tamanhos comuns para sugestão
const TAMANHOS_ROUPA = ['1', '2', '4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G', 'GG']
const TAMANHOS_CALCADO = ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40']

function CriancaVazia(numeroFicha: string, sequencia: number): Crianca {
  return {
    idCrianca: gerarIdCrianca(numeroFicha, sequencia),
    nomeCompleto: '',
    sexo: 'M',
    dataNascimento: null,
    idadeTexto: null,
    tamCamiseta: '',
    tamCalca: '',
    tamCalcado: '',
    tea: false,
    observacao: '',
    preferencial: '',
    observacao2: '',
    apadrinhamento: null,
    presenteNaEntrada: false,
  }
}

export function CadastroFichaPage() {
  const { usuario } = useAuth()
  const { campanha } = useCampanha()
  const navigate = useNavigate()
  const params = useParams()
  const isAdmin = usuario?.role === 'admin'
  const editMode = !!params.fichaId

  const [numeroFicha, setNumeroFicha] = useState('')
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [cpfResponsavel, setCpfResponsavel] = useState('')
  const [contatoResponsavel, setContatoResponsavel] = useState('')
  const [qtdeAdultos, setQtdeAdultos] = useState('1')
  const [observacao, setObservacao] = useState('')
  const [criancas, setCriancas] = useState<Crianca[]>([])
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [fichaOriginal, setFichaOriginal] = useState<Ficha | null>(null)

  // Carregar ficha existente ou preparar nova
  useEffect(() => {
    if (!campanha) return

    if (editMode && params.fichaId) {
      getFicha(campanha.id, params.fichaId).then((ficha) => {
        if (ficha) {
          setFichaOriginal(ficha)
          setNumeroFicha(ficha.numeroFicha)
          setNomeResponsavel(ficha.nomeResponsavel)
          setCpfResponsavel(ficha.cpfResponsavel)
          setContatoResponsavel(ficha.contatoResponsavel)
          setQtdeAdultos(String(ficha.qtdeAdultos))
          setObservacao(ficha.observacao)
          setCriancas(ficha.criancas)
        }
      })
    } else {
      // Nova ficha: sugerir próximo número da primeira origem
      if (campanha.origens.length > 0) {
        proximoNumeroFicha(campanha.id, campanha.origens[0]).then((n) => {
          setNumeroFicha(n.toString().padStart(3, '0'))
          setCriancas([CriancaVazia(n.toString().padStart(3, '0'), 1)])
        })
      }
    }
  }, [campanha, editMode, params.fichaId])

  // Atualizar IDs das crianças quando muda o número da ficha
  useEffect(() => {
    if (!editMode && numeroFicha) {
      setCriancas((prev) =>
        prev.map((c, i) => ({ ...c, idCrianca: gerarIdCrianca(numeroFicha, i + 1) })),
      )
    }
  }, [numeroFicha, editMode])

  const origem = campanha && numeroFicha
    ? derivarOrigem(parseInt(numeroFicha) || 0, campanha.origens)
    : ''

  const addCrianca = () => {
    if (criancas.length >= 10) {
      toast.error('Máximo de 10 crianças por ficha')
      return
    }
    setCriancas([...criancas, CriancaVazia(numeroFicha, criancas.length + 1)])
  }

  const removeCrianca = (index: number) => {
    const novas = criancas.filter((_, i) => i !== index)
    // Reordenar IDs
    novas.forEach((c, i) => {
      c.idCrianca = gerarIdCrianca(numeroFicha, i + 1)
    })
    setCriancas(novas)
  }

  const updateCrianca = (index: number, field: keyof Crianca, value: unknown) => {
    const novas = [...criancas]
    novas[index] = { ...novas[index], [field]: value }
    setCriancas(novas)
  }

  const validar = (): string | null => {
    if (!numeroFicha) return 'O número da ficha é obrigatório'
    if (!nomeResponsavel.trim()) return 'O nome da mãe é obrigatório'
    if (criancas.length === 0) return 'Cadastre pelo menos uma criança'
    for (let i = 0; i < criancas.length; i++) {
      const c = criancas[i]
      if (!c.nomeCompleto.trim()) return `O nome da criança ${i + 1} é obrigatório`
      if (!c.dataNascimento && !c.idadeTexto) return `Informe a data de nascimento ou idade da criança ${i + 1}`
    }
    return null
  }

  const handleSave = async () => {
    const erro = validar()
    if (erro) {
      toast.error(erro)
      return
    }
    if (!campanha) return

    setLoading(true)
    try {
      const fichaData = {
        numeroFicha,
        nomeResponsavel: nomeResponsavel.toUpperCase(),
        cpfResponsavel,
        contatoResponsavel,
        origem,
        qtdeAdultos: parseInt(qtdeAdultos) || 1,
        qtdeCriancas: criancas.length,
        observacao,
        status: 'ativa' as const,
        motivoCancelamento: null,
        dataCancelamento: null,
        criancas,
      }

      if (editMode && params.fichaId) {
        await updateFicha(campanha.id, params.fichaId, fichaData)
        toast.success(`Ficha ${numeroFicha} atualizada com ${criancas.length} criança(s) ✓`)
      } else {
        await createFicha(campanha.id, fichaData)
        toast.success(`Ficha ${numeroFicha} salva com ${criancas.length} criança(s) ✓`)
      }
      setSalvo(true)
      setTimeout(() => navigate(-1), 1500)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!campanha || !params.fichaId || !motivoCancelamento.trim()) return
    setLoading(true)
    try {
      await cancelarFicha(campanha.id, params.fichaId, motivoCancelamento)
      toast.success(`Ficha ${numeroFicha} cancelada`)
      navigate(-1)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cancelar ficha')
    } finally {
      setLoading(false)
    }
  }

  if (salvo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-20 w-20 text-green-600" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Ficha salva!</h2>
          <p className="mt-2 text-gray-500">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
              <span className="ml-1">Voltar</span>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              {editMode ? `Editar Ficha ${numeroFicha}` : 'Nova Ficha'}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* ─── Dados da Mãe ─── */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">📋 Dados da Mãe</h2>

          <div className="space-y-4">
            <div>
              <Label className="mb-1 block text-base">Número da Ficha *</Label>
              <Input
                value={numeroFicha}
                onChange={(e) => setNumeroFicha(e.target.value)}
                placeholder="001"
                maxLength={3}
                className="text-lg"
                disabled={editMode}
              />
              {origem && (
                <p className="mt-1 text-sm text-green-600">
                  → Origem: <strong>{origem}</strong>
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1 block text-base">Nome Completo da Mãe *</Label>
              <Input
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Digite o nome completo"
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-base">CPF</Label>
                <Input
                  value={cpfResponsavel}
                  onChange={(e) => setCpfResponsavel(e.target.value)}
                  placeholder="00000000000"
                  className="text-lg"
                />
              </div>
              <div>
                <Label className="mb-1 block text-base">Telefone</Label>
                <Input
                  value={contatoResponsavel}
                  onChange={(e) => setContatoResponsavel(e.target.value)}
                  placeholder="11999999999"
                  className="text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-base">Quantidade de Adultos</Label>
                <Input
                  type="number"
                  min="1"
                  value={qtdeAdultos}
                  onChange={(e) => setQtdeAdultos(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div>
                <Label className="mb-1 block text-base">Observação</Label>
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Opcional"
                  className="text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Crianças ─── */}
        {criancas.map((crianca, index) => (
          <CriancaForm
            key={index}
            crianca={crianca}
            index={index}
            onChange={(field, value) => updateCrianca(index, field, value)}
            onRemove={() => removeCrianca(index)}
            canRemove={criancas.length > 1}
          />
        ))}

        {/* ─── Adicionar Criança ─── */}
        {criancas.length < 10 && (
          <Button
            size="xl"
            variant="outline"
            className="w-full border-2 border-dashed border-green-400 text-green-700 hover:bg-green-50"
            onClick={addCrianca}
          >
            <Plus className="mr-2 h-6 w-6" />
            Adicionar Criança
          </Button>
        )}

        {/* ─── Ações ─── */}
        <div className="sticky bottom-0 flex gap-3 bg-gray-50 py-4">
          <Button
            size="xl"
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="mr-2 h-5 w-5" />
            {loading ? 'Salvando...' : editMode ? 'Atualizar Ficha' : 'Salvar Ficha'}
          </Button>
          {editMode && isAdmin && fichaOriginal?.status === 'ativa' && (
            <Button
              size="xl"
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={loading}
            >
              <Ban className="h-5 w-5" />
            </Button>
          )}
        </div>
      </main>

      {/* ─── Dialog de Cancelamento ─── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-bold">Cancelar Ficha {numeroFicha}</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              A ficha será cancelada (não deletada). O número <strong>{numeroFicha}</strong> não poderá ser reusado.
              {fichaOriginal?.criancas.some((c) => c.apadrinhamento) && (
                <span className="mt-2 block font-semibold text-red-600">
                  ⚠️ Esta ficha tem crianças apadrinhadas. Desfaça o apadrinhamento antes de cancelar.
                </span>
              )}
            </p>
            <div className="mb-4">
              <Label className="mb-1 block">Motivo do cancelamento *</Label>
              <Input
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: preenchida errada"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCancelDialog(false)
                  setMotivoCancelamento('')
                }}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
                disabled={!motivoCancelamento.trim() || fichaOriginal?.criancas.some((c) => c.apadrinhamento)}
              >
                Cancelar Ficha
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: Formulário de Criança ──────────────

function CriancaForm({
  crianca,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  crianca: Crianca
  index: number
  onChange: (field: keyof Crianca, value: unknown) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [naoSabeData, setNaoSabeData] = useState(!crianca.dataNascimento && !!crianca.idadeTexto)
  const { campanha } = useCampanha()

  const dataFesta = campanha?.dataEvento
    ? new Date(campanha.dataEvento.seconds * 1000).toISOString().split('T')[0]
    : '2026-12-13'
  const idadeCalculada = !naoSabeData && crianca.dataNascimento
    ? calcularIdade(crianca.dataNascimento, dataFesta)
    : ''

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Baby className="h-5 w-5 text-blue-600" />
          Criança {index + 1}
          <Badge variant="secondary" className="ml-2 font-mono">
            {crianca.idCrianca}
          </Badge>
        </h2>
        {canRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-1 block text-base">Nome Completo *</Label>
          <Input
            value={crianca.nomeCompleto}
            onChange={(e) => onChange('nomeCompleto', e.target.value)}
            placeholder="Digite o nome completo da criança"
            className="text-lg"
          />
        </div>

        {/* Sexo - botões grandes */}
        <div>
          <Label className="mb-2 block text-base">Sexo *</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange('sexo', 'M' as Sexo)}
              className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-lg border-2 text-lg font-semibold transition-colors ${
                crianca.sexo === 'M'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              ♂ Masculino
            </button>
            <button
              type="button"
              onClick={() => onChange('sexo', 'F' as Sexo)}
              className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-lg border-2 text-lg font-semibold transition-colors ${
                crianca.sexo === 'F'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              ♀ Feminino
            </button>
          </div>
        </div>

        {/* Data de nascimento OU idade */}
        <div>
          <Label className="mb-2 block text-base">
            {naoSabeData ? 'Idade *' : 'Data de Nascimento *'}
          </Label>
          {!naoSabeData ? (
            <>
              <Input
                type="date"
                value={crianca.dataNascimento || ''}
                onChange={(e) => onChange('dataNascimento', e.target.value)}
                className="text-lg"
              />
              {idadeCalculada && (
                <p className="mt-1 text-sm text-green-600">
                  Idade no dia da festa: <strong>{idadeCalculada}</strong>
                </p>
              )}
            </>
          ) : (
            <Input
              value={crianca.idadeTexto || ''}
              onChange={(e) => onChange('idadeTexto', e.target.value)}
              placeholder="Ex: 4 anos"
              className="text-lg"
            />
          )}
          <button
            type="button"
            onClick={() => {
              setNaoSabeData(!naoSabeData)
              if (!naoSabeData) {
                onChange('dataNascimento', null)
              } else {
                onChange('idadeTexto', null)
              }
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            {naoSabeData ? '← Sabe a data de nascimento?' : 'Não sabe a data? Digitar idade →'}
          </button>
        </div>

        {/* Tamanhos */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1 block text-base">Camisa</Label>
            <Input
              value={crianca.tamCamiseta}
              onChange={(e) => onChange('tamCamiseta', e.target.value)}
              placeholder="Ex: 6"
              className="text-lg"
              list="tamanhos-roupa"
            />
            <datalist id="tamanhos-roupa">
              {TAMANHOS_ROUPA.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <Label className="mb-1 block text-base">Calça</Label>
            <Input
              value={crianca.tamCalca}
              onChange={(e) => onChange('tamCalca', e.target.value)}
              placeholder="Ex: 6"
              className="text-lg"
              list="tamanhos-roupa"
            />
          </div>
          <div>
            <Label className="mb-1 block text-base">Calçado</Label>
            <Input
              value={crianca.tamCalcado}
              onChange={(e) => onChange('tamCalcado', e.target.value)}
              placeholder="Ex: 26"
              className="text-lg"
              list="tamanhos-calcado"
            />
            <datalist id="tamanhos-calcado">
              {TAMANHOS_CALCADO.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        {/* TEA */}
        <div>
          <button
            type="button"
            onClick={() => onChange('tea', !crianca.tea)}
            className={`flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 text-lg font-semibold transition-colors ${
              crianca.tea
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {crianca.tea ? '✓ Tem TEA (Autismo)' : 'Não tem TEA'}
          </button>
        </div>

        {/* Observação */}
        <div>
          <Label className="mb-1 block text-base">Observação</Label>
          <Input
            value={crianca.observacao}
            onChange={(e) => onChange('observacao', e.target.value)}
            placeholder="Opcional"
            className="text-lg"
          />
        </div>
      </div>
    </section>
  )
}
