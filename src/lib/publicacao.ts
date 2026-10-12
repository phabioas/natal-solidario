import type { Crianca } from '@/models/types'
import { calcularIdadeAnosMeses } from '@/lib/idade'

export const PUBLIC_LIST_ID = 'natal-2026-cbdak7g'
export const PUBLIC_LIST_PATH = `/disponiveis/${PUBLIC_LIST_ID}`

export function mascararNomeCrianca(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0]
  if (partes.length === 2) return `${partes[0]} *** ${partes[1][0].toUpperCase()}.`
  return `${partes[0]} *** ${partes[partes.length - 1]}`
}

export function criarCriancaPublica(crianca: Crianca, dataEvento: string) {
  return {
    idCrianca: crianca.idCrianca,
    numeroFicha: crianca.idCrianca.split('/')[0],
    nomePublico: mascararNomeCrianca(crianca.nomeCompleto),
    idade: crianca.dataNascimento
      ? calcularIdadeAnosMeses(crianca.dataNascimento, dataEvento)
      : crianca.idadeTexto || '-',
  }
}

export function publicChildDocId(idCrianca: string): string {
  return idCrianca.replace('/', '-')
}
