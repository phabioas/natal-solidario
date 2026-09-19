import { before, after, beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'

const projectId = 'natal-solidario-rules-test'
let env

const campanha = {
  ano: 2026,
  nome: 'Natal Solidário 2026',
  dataEvento: Timestamp.fromDate(new Date('2026-12-13T12:00:00Z')),
  localEvento: { nome: 'Local', endereco: 'Rua', cidade: 'Cidade', cep: '00000-000' },
  ativa: true,
  origens: [],
  createdAt: Timestamp.now(),
}

const crianca = {
  idCrianca: '001/01',
  nomeCompleto: 'Criança Teste',
  sexo: 'F',
  dataNascimento: '2020-01-01',
  idadeTexto: null,
  tamCamiseta: '8',
  tamCalca: '8',
  tamCalcado: '30',
  tea: false,
  observacao: '',
  preferencial: '',
  observacao2: '',
  apadrinhamento: null,
  presenteNaEntrada: false,
}

const ficha = {
  numeroFicha: '001',
  nomeResponsavel: 'Responsável Teste',
  cpfResponsavel: '12345678901',
  contatoResponsavel: '11999999999',
  origem: 'Canadá',
  qtdeAdultos: 1,
  qtdeCriancas: 1,
  observacao: '',
  status: 'ativa',
  motivoCancelamento: null,
  dataCancelamento: null,
  criancas: [crianca],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
}

const contato = {
  nome: 'Contato Teste',
  telefone: '11999999999',
  email: null,
  uid: null,
  createdAt: Timestamp.now(),
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

after(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'usuarios/admin'), { email: 'admin@test.local', nome: 'Admin', role: 'admin', createdAt: Timestamp.now() })
    await setDoc(doc(db, 'usuarios/equipe'), { email: 'equipe@test.local', nome: 'Equipe', role: 'equipe', createdAt: Timestamp.now() })
    await setDoc(doc(db, 'campanhas/campanha-2026'), campanha)
    await setDoc(doc(db, 'campanhas/campanha-2026/fichas/001'), ficha)
    await setDoc(doc(db, 'campanhas/campanha-2026/contatos/contato-1'), contato)
  })
})

describe('usuário não autenticado', () => {
  it('não lê campanhas nem fichas', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'campanhas/campanha-2026')))
    await assertFails(getDoc(doc(db, 'campanhas/campanha-2026/fichas/001')))
  })
})

describe('equipe', () => {
  it('lê o próprio perfil e não lista usuários', async () => {
    const db = env.authenticatedContext('equipe').firestore()
    await assertSucceeds(getDoc(doc(db, 'usuarios/equipe')))
    await assertFails(getDoc(doc(db, 'usuarios/admin')))
    await assertFails(getDocs(collection(db, 'usuarios')))
  })

  it('acessa e atualiza o fluxo operacional', async () => {
    const db = env.authenticatedContext('equipe').firestore()
    await assertSucceeds(getDoc(doc(db, 'campanhas/campanha-2026')))
    await assertSucceeds(getDoc(doc(db, 'campanhas/campanha-2026/fichas/001')))
    await assertSucceeds(updateDoc(doc(db, 'campanhas/campanha-2026/fichas/001'), {
      observacao: 'Atualizada pela equipe',
      updatedAt: Timestamp.now(),
    }))
  })

  it('cria ficha válida e rejeita campos inesperados', async () => {
    const db = env.authenticatedContext('equipe').firestore()
    await assertSucceeds(setDoc(doc(db, 'campanhas/campanha-2026/fichas/002'), {
      ...ficha,
      numeroFicha: '002',
      criancas: [{ ...crianca, idCrianca: '002/01' }],
    }))
    await assertFails(setDoc(doc(db, 'campanhas/campanha-2026/fichas/003'), {
      ...ficha,
      numeroFicha: '003',
      campoInesperado: 'não permitido',
    }))
  })

  it('não altera campanhas nem exclui fichas/contatos', async () => {
    const db = env.authenticatedContext('equipe').firestore()
    await assertFails(updateDoc(doc(db, 'campanhas/campanha-2026'), { nome: 'Alterada' }))
    await assertFails(deleteDoc(doc(db, 'campanhas/campanha-2026/fichas/001')))
    await assertFails(deleteDoc(doc(db, 'campanhas/campanha-2026/contatos/contato-1')))
  })
})

describe('admin', () => {
  it('lista usuários e gerencia campanhas', async () => {
    const db = env.authenticatedContext('admin').firestore()
    await assertSucceeds(getDocs(collection(db, 'usuarios')))
    await assertSucceeds(updateDoc(doc(db, 'campanhas/campanha-2026'), { nome: 'Campanha Atualizada' }))
  })

  it('rejeita perfil inválido e não permite autoexclusão', async () => {
    const db = env.authenticatedContext('admin').firestore()
    await assertFails(setDoc(doc(db, 'usuarios/invalido'), {
      email: 'invalido@test.local', nome: 'Inválido', role: 'superadmin', createdAt: Timestamp.now(),
    }))
    await assertFails(deleteDoc(doc(db, 'usuarios/admin')))
    await assertSucceeds(deleteDoc(doc(db, 'usuarios/equipe')))
  })
})
