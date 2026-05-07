import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_CONFIG_KEY,
  authDomain: "gullyfoods.firebaseapp.com",
  projectId: "gullyfoods",
  storageBucket: "gullyfoods.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);
