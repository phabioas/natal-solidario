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

describe('convite por email', () => {
  it('permite que o convidado ative o próprio perfil no primeiro login', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'convites/novo@gmail.com'), {
        email: 'novo@gmail.com', nome: 'Novo Usuário', role: 'equipe', createdAt: Timestamp.now(),
      })
    })
    const db = env.authenticatedContext('novo-uid', { email: 'novo@gmail.com', email_verified: true }).firestore()
    await assertSucceeds(getDoc(doc(db, 'convites/novo@gmail.com')))
    await assertSucceeds(setDoc(doc(db, 'usuarios/novo-uid'), {
      email: 'novo@gmail.com', nome: 'Novo Usuário', role: 'equipe', createdAt: Timestamp.now(),
    }))
    await assertSucceeds(deleteDoc(doc(db, 'convites/novo@gmail.com')))
  })

  it('rejeita usuário não convidado e troca de perfil no cadastro', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'convites/novo@gmail.com'), {
        email: 'novo@gmail.com', nome: 'Novo Usuário', role: 'equipe', createdAt: Timestamp.now(),
      })
    })
    const db = env.authenticatedContext('novo-uid', { email: 'novo@gmail.com', email_verified: true }).firestore()
    await assertFails(setDoc(doc(db, 'usuarios/novo-uid'), {
      email: 'novo@gmail.com', nome: 'Novo Usuário', role: 'admin', createdAt: Timestamp.now(),
    }))
    const outroDb = env.authenticatedContext('outro-uid', { email: 'outro@gmail.com', email_verified: true }).firestore()
    await assertFails(getDoc(doc(outroDb, 'convites/novo@gmail.com')))
  })
})

describe('admin', () => {
  it('lista usuários e gerencia campanhas', async () => {
    const db = env.authenticatedContext('admin').firestore()
    await assertSucceeds(getDocs(collection(db, 'usuarios')))
    await assertSucceeds(updateDoc(doc(db, 'campanhas/campanha-2026'), { nome: 'Campanha Atualizada' }))
  })

  it('cria convite válido e rejeita convite com email divergente', async () => {
    const db = env.authenticatedContext('admin').firestore()
    await assertSucceeds(setDoc(doc(db, 'convites/convidado@gmail.com'), {
      email: 'convidado@gmail.com', nome: 'Convidado', role: 'equipe', createdAt: Timestamp.now(),
    }))
    await assertFails(setDoc(doc(db, 'convites/outro@gmail.com'), {
      email: 'divergente@gmail.com', nome: 'Outro', role: 'equipe', createdAt: Timestamp.now(),
    }))
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
