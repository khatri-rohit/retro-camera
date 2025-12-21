import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAH_YQU_DoscgYGW0DhOl9uvZAw6uoYIGg",
  authDomain: "retro-camera-81cb2.firebaseapp.com",
  projectId: "retro-camera-81cb2",
  storageBucket: "retro-camera-81cb2.firebasestorage.app",
  messagingSenderId: "101821215306",
  appId: "1:101821215306:web:626d1914d952942141acb3",
  measurementId: "G-MRP2CJ0HGH",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
