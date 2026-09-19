import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

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

// Enable offline persistence for check-in resilience (NRF02)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore offline persistence: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore offline persistence: not supported in this browser')
  }
})
