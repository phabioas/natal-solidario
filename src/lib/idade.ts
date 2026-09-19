/**
 * Calcula a idade entre duas datas no formato "XA Ym Zd"
 * (X anos, Y meses, Z dias)
 */
export function calcularIdade(dataNascimento: string | Date, dataReferencia: string | Date): string {
  const nasc = new Date(dataNascimento)
  const ref = new Date(dataReferencia)

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
 * Calcula idade completa com anos, meses e dias
 */
export function calcularIdadeDetalhada(dataNascimento: string | Date, dataReferencia: string | Date) {
  const nasc = new Date(dataNascimento)
  const ref = new Date(dataReferencia)

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
