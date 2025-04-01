"use client"

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getApp } from "firebase/app"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDe8UsqoUitF8Dto0w2X0ZG558YeFIFlrY",
  authDomain: "uffa-expence-tracker-app.firebaseapp.com",
  projectId: "uffa-expence-tracker-app",
  storageBucket: "uffa-expence-tracker-app.appspot.com",
  messagingSenderId: "148995235844",
  appId: "1:148995235844:web:aa46075344159f4a879551",
  measurementId: "G-GV0LRZBCWZ",
}

// Initialize Firebase
let app
try {
  app = getApp()
} catch (e) {
  app = initializeApp(firebaseConfig)
}

const db = getFirestore(app)
const storage = getStorage(app)

const clientStorage = storage

export { db, storage, app, clientStorage }

