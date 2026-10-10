/**
 * Interpreta uma data civil (AAAA-MM-DD) sem aplicar conversão de fuso horário.
 * Datas de nascimento não representam um instante UTC.
 */
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) return new Date(value.getTime())

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(value)

  const ano = Number(match[1])
  const mes = Number(match[2])
  const dia = Number(match[3])
  // Meio-dia local evita transições excepcionais de horário de verão à meia-noite.
  const date = new Date(ano, mes - 1, dia, 12)
  if (date.getFullYear() !== ano || date.getMonth() !== mes - 1 || date.getDate() !== dia) {
    return new Date(NaN)
  }
  return date
}

export function formatDateOnly(value: string | Date): string {
  const date = parseDateOnly(value)
  if (isNaN(date.getTime())) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Calcula a idade entre duas datas no formato "XA Ym Zd"
 * (X anos, Y meses, Z dias)
 */
export function calcularIdade(dataNascimento: string | Date, dataReferencia: string | Date): string {
  const nasc = parseDateOnly(dataNascimento)
  const ref = parseDateOnly(dataReferencia)

  if (isNaN(nasc.getTime()) || isNaN(ref.getTime())) return ''
  if (ref < nasc) return ''

  let anos = ref.getFullYear() - nasc.getFullYear()
  let meses = ref.getMonth() - nasc.getMonth()
  let dias = ref.getDate() - nasc.getDate()

  if (dias < 0) {
    meses--
    const mesAnterior = new Date(ref.getFullYear(), ref.getMonth(), 0)
    dias += mesAnterior.getDate()
  }
  if (meses < 0) {
    anos--
    meses += 12
  }

  const partes: string[] = []
  if (anos > 0) partes.push(`${anos}A`)
  if (meses > 0) partes.push(`${meses}m`)
  if (dias > 0) partes.push(`${dias}d`)
  return partes.join(' ') || '0d'
}

/**
 * Calcula a idade exibindo somente anos e meses.
 * Usado nos materiais enviados aos padrinhos.
 */
export function calcularIdadeAnosMeses(dataNascimento: string | Date, dataReferencia: string | Date): string {
  const idade = calcularIdadeDetalhada(dataNascimento, dataReferencia)
  if (!idade) return ''
  return `${idade.anos}A ${idade.meses}m`
}

/**
 * Calcula idade completa com anos, meses e dias
 */
export function calcularIdadeDetalhada(dataNascimento: string | Date, dataReferencia: string | Date) {
  const nasc = parseDateOnly(dataNascimento)
  const ref = parseDateOnly(dataReferencia)

  if (isNaN(nasc.getTime()) || isNaN(ref.getTime())) return null
  if (ref < nasc) return null

  let anos = ref.getFullYear() - nasc.getFullYear()
  let meses = ref.getMonth() - nasc.getMonth()
  let dias = ref.getDate() - nasc.getDate()

  if (dias < 0) {
    meses--
    const mesAnterior = new Date(ref.getFullYear(), ref.getMonth(), 0)
    dias += mesAnterior.getDate()
  }
  if (meses < 0) {
    anos--
    meses += 12
  }

  return { anos, meses, dias }
}
