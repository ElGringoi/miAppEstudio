import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración del proyecto Firebase "agenda-50bb7"
const firebaseConfig = {
  apiKey: 'AIzaSyChxa0p_63RtxfVTuMuwg0t5l39SwBG7KM',
  authDomain: 'agenda-50bb7.firebaseapp.com',
  projectId: 'agenda-50bb7',
  storageBucket: 'agenda-50bb7.firebasestorage.app',
  messagingSenderId: '543530778802',
  appId: '1:543530778802:web:6b2efb4eba128fc4f409ab',
  measurementId: 'G-85NB8VP8CD',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
