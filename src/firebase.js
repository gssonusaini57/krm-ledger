import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB9dbBmYD8G4bIRV3R9MiO9ouPpe8eg-v0",
  authDomain: "krm-ledger.firebaseapp.com",
  projectId: "krm-ledger",
  storageBucket: "krm-ledger.firebasestorage.app",
  messagingSenderId: "289491939235",
  appId: "1:289491939235:web:5c5d09fceead458fc67416",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
