// /cultivo-blocos/js/firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCo7MOVfaalrDg0o0GpYJ4-YNL4OCrjfXE",
  authDomain: "jungle-brothers-93e80.firebaseapp.com",
  projectId: "jungle-brothers-93e80",
  storageBucket: "jungle-brothers-93e80.appspot.com",
  messagingSenderId: "221354970870",
  appId: "1:221354970870:web:a7f68c75480dc094bbad67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
