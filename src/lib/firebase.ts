import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { clearIndexedDbPersistence, getFirestore, terminate } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAJbBO-Lbybse2SFuLQyvuzzBSYBPiYMq4',
  appId: '1:149420673083:web:e37012dbddf7e61a32341e',
  messagingSenderId: '149420673083',
  projectId: 'getj-natal',
  authDomain: 'getj-natal.firebaseapp.com',
  storageBucket: 'getj-natal.firebasestorage.app',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Dados pessoais permanecem apenas na memória da sessão. Ao sair, remove também
// qualquer cache IndexedDB criado por versões anteriores da aplicação.
export async function clearLocalFirestoreCache(): Promise<void> {
  try {
    await terminate(db)
    await clearIndexedDbPersistence(db)
  } catch (err) {
    console.warn('Não foi possível limpar completamente o cache local do Firestore', err)
  }
}
