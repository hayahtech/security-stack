import { initializeApp, getApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

/**
 * 🔐 CONFIGURAÇÃO DO FIREBASE
 * Substitua APENAS os valores abaixo
 * (copiados do Firebase Console – App Web)
 */
const firebaseConfig = {
  apiKey: "AIzaSyCuAtdZ3ZUiKh57I9vzQBKoa1X9BwlejK0",
  authDomain: "painting-works-app.firebaseapp.com",
  projectId: "painting-works-app",
  storageBucket: "painting-works-app.firebasestorage.app",
  messagingSenderId: "601271782996",
  appId: "1:601271782996:web:b5747256456c552d6167c1"
};

/**
 * 🚀 Inicialização do Firebase (singleton)
 */
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

/**
 * 🔑 Firebase Auth com persistência (AsyncStorage)
 * Mantém o usuário logado mesmo fechando o app
 */
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

/**
 * 🗄️ Firestore Database
 */
const db = getFirestore(app);

/**
 * 📦 Firebase Storage (upload de fotos)
 */
const storage = getStorage(app);

export { auth, db, storage };
