import type { Timestamp } from 'firebase/firestore'

// ─── Enums ──────────────────────────────────────────────

export type Sexo = 'M' | 'F'

export type FichaStatus = 'ativa' | 'cancelada'

export type SacolaStatus =
  | 'pendente'
  | 'entregue'
  | 'faltando_itens'
  | 'conferida'
  | 'no_salao'
  | 'entregue_crianca'

export type UserRole = 'admin' | 'equipe'

// ─── Apadrinhamento ─────────────────────────────────────

export interface Apadrinhamento {
  padrinho: string
  contatoId: string
  contatoNome: string // denormalizado para display
  status: SacolaStatus
  observacaoConferencia: string
  pasta: string
  dataApadrinhada: Timestamp | null
  dataEntregue: Timestamp | null
  dataConferida: Timestamp | null
  dataNoSalao: Timestamp | null
  dataEntregueCrianca: Timestamp | null
}

// ─── Criança ────────────────────────────────────────────

export interface Crianca {
  idCrianca: string // "001/01"
  nomeCompleto: string
  sexo: Sexo
  dataNascimento: string | null // ISO date
  idadeTexto: string | null // "4 anos" quando não sabe a data
  tamCamiseta: string
  tamCalca: string
  tamCalcado: string
  tea: boolean
  observacao: string
  preferencial: string
  observacao2: string
  apadrinhamento: Apadrinhamento | null
  presenteNaEntrada: boolean
}

// ─── Ficha (Mãe/Responsável) ────────────────────────────

export interface Ficha {
  id: string // document ID = numeroFicha
  numeroFicha: string // "001"
  nomeResponsavel: string
  cpfResponsavel: string
  contatoResponsavel: string // telefone
  origem: string // derivado do número
  qtdeAdultos: number
  qtdeCriancas: number
  observacao: string
  status: FichaStatus
  motivoCancelamento: string | null
  dataCancelamento: Timestamp | null
  criancas: Crianca[]
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

// ─── Contato (Voluntário GETJ) ──────────────────────────

export interface Contato {
  id: string
  nome: string
  telefone: string
  email: string | null
  uid: string | null // future Firebase Auth link
  createdAt: Timestamp | null
}

// ─── Origem (Região/Grupo) ──────────────────────────────

export interface Origem {
  nome: string
  fichaInicio: number
  fichaFim: number
  metaCriancas: number
}

// ─── Campanha ───────────────────────────────────────────

export interface LocalEvento {
  nome: string
  endereco: string
  cidade: string
  cep: string
}

export interface Campanha {
  id: string
  ano: number
  nome: string
  dataEvento: Timestamp | null
  localEvento: LocalEvento
  ativa: boolean
  origens: Origem[]
  createdAt: Timestamp | null
}

// ─── Usuário (Admin/Equipe) ─────────────────────────────

export interface Usuario {
  id: string // Firebase Auth UID
  email: string
  nome: string
  role: UserRole
  createdAt: Timestamp | null
}

// ─── Helpers ────────────────────────────────────────────

export const SACOLA_STATUS_LABELS: Record<SacolaStatus, string> = {
  pendente: 'Pendente',
  entregue: 'Entregue',
  faltando_itens: 'Faltando itens',
  conferida: 'Conferida',
  no_salao: 'No salão',
  entregue_crianca: 'Entregue à criança',
}

export const SACOLA_STATUS_COLORS: Record<SacolaStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  entregue: 'bg-blue-100 text-blue-800',
  faltando_itens: 'bg-red-100 text-red-800',
  conferida: 'bg-green-100 text-green-800',
  no_salao: 'bg-purple-100 text-purple-800',
  entregue_crianca: 'bg-emerald-100 text-emerald-800',
}

export function derivarOrigem(numeroFicha: number, origens: Origem[]): string {
  for (const origem of origens) {
    if (numeroFicha >= origem.fichaInicio && numeroFicha <= origem.fichaFim) {
      return origem.nome
    }
  }
  return 'Avulsas'
}

export function gerarIdCrianca(numeroFicha: string, sequencia: number): string {
  return `${numeroFicha}/${sequencia.toString().padStart(2, '0')}`
}
