import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDsHZX-MBWUMGocEIMUdkYbu0KYgqNRVes",
  authDomain: "weekly-b1e97.firebaseapp.com",
  projectId: "weekly-b1e97",
  storageBucket: "weekly-b1e97.firebasestorage.app",
  messagingSenderId: "423912531179",
  appId: "1:423912531179:web:ee7666a2c9b52a68a1caae",
  measurementId: "G-06DY7K5LRV"
};

// 2. 앱 초기화
const app = initializeApp(firebaseConfig);

// 3. 밖에서 쓸 수 있게 export (이게 없어서 오류가 난 겁니다)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);