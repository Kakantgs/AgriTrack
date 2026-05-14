import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
    apiKey: "AIzaSyARsat46fM6gq7RHBZNM35Md29_PrW1Sls",
    authDomain: "apphorta-ca6b7.firebaseapp.com",
    databaseURL: "https://apphorta-ca6b7-default-rtdb.firebaseio.com",
    projectId: "apphorta-ca6b7",
    storageBucket: "apphorta-ca6b7.firebasestorage.app",
    messagingSenderId: "725625290947",
    appId: "1:725625290947:web:309b1c46370a9d4bae6276",
    measurementId: "G-1GLE5CPDET"
};
const app = initializeApp(firebaseConfig);
export const realtimeDb = getDatabase(app);
