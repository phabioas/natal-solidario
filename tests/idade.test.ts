import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularIdade, formatDateOnly, parseDateOnly } from '../src/lib/idade.ts'

test('formata data civil sem deslocamento de fuso horário', () => {
  assert.equal(formatDateOnly('2016-09-11'), '11/09/2016')
  assert.equal(formatDateOnly('2022-04-19'), '19/04/2022')
})

test('interpreta os componentes originais de AAAA-MM-DD', () => {
  const date = parseDateOnly('2016-09-11')
  assert.equal(date.getFullYear(), 2016)
  assert.equal(date.getMonth(), 8)
  assert.equal(date.getDate(), 11)
})

test('calcula idade usando datas civis', () => {
  assert.equal(calcularIdade('2016-09-11', '2026-12-13'), '10A 3m 2d')
})
