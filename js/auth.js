import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCo7MOVfaalrDg0o0GpYJ4-YNL4OCrjfXE",
  authDomain: "jungle-brothers-93e80.firebaseapp.com",
  projectId: "jungle-brothers-93e80",
  storageBucket: "jungle-brothers-93e80.appspot.com",
  messagingSenderId: "221354970870",
  appId: "1:221354970870:web:a7f68c75480dc094bbad67"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/login.html";
  }
});
