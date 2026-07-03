const firebaseConfig = {
  apiKey: "AIzaSyDuxvxGynmz8NJ_dayDDy8W6pbovl0xPIw",
  authDomain: "benchat-ai-9c313.firebaseapp.com",
  projectId: "benchat-ai-9c313",
  storageBucket: "benchat-ai-9c313.firebasestorage.app",
  messagingSenderId: "217931451091",
  appId: "1:217931451091:web:4e1253c3011d9348a62226"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
