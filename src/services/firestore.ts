import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Campanha,
  Ficha,
  Contato,
  Usuario,
  Origem,
  Crianca,
  SacolaStatus,
} from '@/models/types'
import { derivarOrigem } from '@/models/types'

// ─── Campanhas ──────────────────────────────────────────

export async function getCampanhas(): Promise<Campanha[]> {
  const snap = await getDocs(collection(db, 'campanhas'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campanha, 'id'>) }))
}

export async function getCampanhaAtiva(): Promise<Campanha | null> {
  const q = query(collection(db, 'campanhas'), where('ativa', '==', true))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...(d.data() as Omit<Campanha, 'id'>) }
}

export function subscribeCampanhaAtiva(callback: (campanha: Campanha | null) => void) {
  const q = query(collection(db, 'campanhas'), where('ativa', '==', true))
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null)
    } else {
      const d = snap.docs[0]
      callback({ id: d.id, ...(d.data() as Omit<Campanha, 'id'>) })
    }
  })
}

export async function createCampanha(campanha: Omit<Campanha, 'id' | 'createdAt'>): Promise<string> {
  // Desativa outras campanhas
  const todas = await getCampanhas()
  for (const c of todas) {
    if (c.ativa) {
      await updateDoc(doc(db, 'campanhas', c.id), { ativa: false })
    }
  }
  const ref = doc(collection(db, 'campanhas'))
  await setDoc(ref, { ...campanha, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateCampanha(id: string, data: Partial<Campanha>): Promise<void> {
  await updateDoc(doc(db, 'campanhas', id), data as never)
}

export async function ativarCampanha(id: string): Promise<void> {
  const todas = await getCampanhas()
  for (const c of todas) {
    if (c.ativa && c.id !== id) {
      await updateDoc(doc(db, 'campanhas', c.id), { ativa: false })
    }
  }
  await updateDoc(doc(db, 'campanhas', id), { ativa: true })
}

// ─── Fichas ─────────────────────────────────────────────

function fichasRef(campanhaId: string) {
  return collection(db, 'campanhas', campanhaId, 'fichas')
}

export async function getFichas(campanhaId: string): Promise<Ficha[]> {
  const snap = await getDocs(fichasRef(campanhaId))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ficha, 'id'>) }))
}

export function subscribeFichas(campanhaId: string, callback: (fichas: Ficha[]) => void) {
  return onSnapshot(fichasRef(campanhaId), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ficha, 'id'>) })))
  })
}

export async function getFicha(campanhaId: string, fichaId: string): Promise<Ficha | null> {
  const snap = await getDoc(doc(fichasRef(campanhaId), fichaId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Ficha, 'id'>) }
}

export async function createFicha(
  campanhaId: string,
  ficha: Omit<Ficha, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const ref = doc(fichasRef(campanhaId), ficha.numeroFicha)
  await setDoc(ref, {
    ...ficha,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateFicha(
  campanhaId: string,
  fichaId: string,
  data: Partial<Ficha>,
): Promise<void> {
  await updateDoc(doc(fichasRef(campanhaId), fichaId), {
    ...data,
    updatedAt: serverTimestamp(),
  } as never)
}

export async function cancelarFicha(
  campanhaId: string,
  fichaId: string,
  motivo: string,
): Promise<void> {
  await updateDoc(doc(fichasRef(campanhaId), fichaId), {
    status: 'cancelada',
    motivoCancelamento: motivo,
    dataCancelamento: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFicha(campanhaId: string, fichaId: string): Promise<void> {
  await deleteDoc(doc(fichasRef(campanhaId), fichaId))
}

// ─── Contatos ───────────────────────────────────────────

function contatosRef(campanhaId: string) {
  return collection(db, 'campanhas', campanhaId, 'contatos')
}

export async function getContatos(campanhaId: string): Promise<Contato[]> {
  const snap = await getDocs(contatosRef(campanhaId))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Contato, 'id'>) }))
}

export function subscribeContatos(campanhaId: string, callback: (contatos: Contato[]) => void) {
  return onSnapshot(contatosRef(campanhaId), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Contato, 'id'>) })))
  })
}

export async function createContato(
  campanhaId: string,
  contato: Omit<Contato, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = doc(contatosRef(campanhaId))
  await setDoc(ref, { ...contato, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateContato(
  campanhaId: string,
  contatoId: string,
  data: Partial<Contato>,
): Promise<void> {
  await updateDoc(doc(contatosRef(campanhaId), contatoId), data as never)
}

export async function deleteContato(campanhaId: string, contatoId: string): Promise<void> {
  await deleteDoc(doc(contatosRef(campanhaId), contatoId))
}

// ─── Usuários ───────────────────────────────────────────

export async function getUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Usuario, 'id'>) }
}

export async function getUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, 'usuarios'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Usuario, 'id'>) }))
}

export function subscribeUsuarios(callback: (usuarios: Usuario[]) => void) {
  return onSnapshot(collection(db, 'usuarios'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Usuario, 'id'>) })))
  })
}

export async function createUsuario(usuario: Omit<Usuario, 'id' | 'createdAt'>, uid: string): Promise<void> {
  await setDoc(doc(db, 'usuarios', uid), { ...usuario, createdAt: serverTimestamp() })
}

export async function updateUsuario(uid: string, data: Partial<Usuario>): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), data as never)
}

export async function deleteUsuario(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'usuarios', uid))
}

// ─── Apadrinhamento ─────────────────────────────────────

export async function apadrinharCrianca(
  campanhaId: string,
  fichaId: string,
  criancas: Crianca[],
  criancaId: string,
  padrinho: string,
  contatoId: string,
  contatoNome: string,
): Promise<void> {
  const atualizadas = criancas.map((c) => {
    if (c.idCrianca === criancaId) {
      return {
        ...c,
        apadrinhamento: {
          padrinho,
          contatoId,
          contatoNome,
          status: 'pendente' as SacolaStatus,
          observacaoConferencia: '',
          pasta: '',
          dataApadrinhada: Timestamp.now(),
          dataEntregue: null,
          dataConferida: null,
          dataNoSalao: null,
          dataEntregueCrianca: null,
        },
      }
    }
    return c
  })
  await updateFicha(campanhaId, fichaId, { criancas: atualizadas })
}

export async function desApadrinharCrianca(
  campanhaId: string,
  fichaId: string,
  criancas: Crianca[],
  criancaId: string,
): Promise<void> {
  const atualizadas = criancas.map((c) => {
    if (c.idCrianca === criancaId) {
      return { ...c, apadrinhamento: null }
    }
    return c
  })
  await updateFicha(campanhaId, fichaId, { criancas: atualizadas })
}

export async function updateSacolaStatus(
  campanhaId: string,
  fichaId: string,
  criancas: Crianca[],
  criancaId: string,
  status: SacolaStatus,
  observacaoConferencia?: string,
): Promise<void> {
  const atualizadas = criancas.map((c) => {
    if (c.idCrianca === criancaId && c.apadrinhamento) {
      const ap = { ...c.apadrinhamento }
      ap.status = status
      if (observacaoConferencia !== undefined) {
        ap.observacaoConferencia = observacaoConferencia
      }
      const now = Timestamp.now()
      if (status === 'entregue') ap.dataEntregue = now
      if (status === 'conferida') ap.dataConferida = now
      if (status === 'no_salao') ap.dataNoSalao = now
      if (status === 'entregue_crianca') ap.dataEntregueCrianca = now
      return { ...c, apadrinhamento: ap }
    }
    return c
  })
  await updateFicha(campanhaId, fichaId, { criancas: atualizadas })
}

export async function checkInCrianca(
  campanhaId: string,
  fichaId: string,
  criancas: Crianca[],
  criancaId: string,
  presente: boolean,
): Promise<void> {
  const atualizadas = criancas.map((c) => {
    if (c.idCrianca === criancaId) {
      return { ...c, presenteNaEntrada: presente }
    }
    return c
  })
  await updateFicha(campanhaId, fichaId, { criancas: atualizadas })
}

// ─── Helper: próximo número de ficha disponível ─────────

export async function proximoNumeroFicha(campanhaId: string, origem: Origem): Promise<number> {
  const fichas = await getFichas(campanhaId)
  const usados = new Set(fichas.map((f) => parseInt(f.numeroFicha)))
  for (let n = origem.fichaInicio; n <= origem.fichaFim; n++) {
    if (!usados.has(n)) return n
  }
  return origem.fichaFim // fallback
}

export { derivarOrigem }
