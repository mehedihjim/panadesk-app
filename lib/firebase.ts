import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBekGVQfA1M0H78CRXiaVTQjwnpCgh59FM",
  authDomain: "pana-desk.firebaseapp.com",
  projectId: "pana-desk",
  storageBucket: "pana-desk.firebasestorage.app",
  messagingSenderId: "177482489592",
  appId: "1:177482489592:web:af90766cb2cf4bcacba50d",
};

// Prevent re-initializing on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
