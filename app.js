// =====================================
// Inicialização Firebase
// =====================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoRcuUkyzcLOTc12iCCehIQgtsgMh1b7Y",
  authDomain: "vagalume-ia.firebaseapp.com",
  projectId: "vagalume-ia",
  storageBucket: "vagalume-ia.firebasestorage.app",
  messagingSenderId: "618522946644",
  appId: "1:618522946644:web:72527f662aa8c181efd1c1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================
// Estado do usuário e redirecionamento
// =====================================
export function checkUserRedirect() {
  onAuthStateChanged(auth, async user => {
    if(user){
      const snap = await getDoc(doc(db,"users",user.uid));
      if(!snap.exists()) return window.location.href = "signup.html";
      const data = snap.data();
      if(data.modo === "premium") window.location.href = "premium.html";
      else window.location.href = "app.html";
    }
  });
}

// =====================================
// Logout
// =====================================
export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

// =====================================
// Signup
// =====================================
export async function signup(email, password, modo, acceptTerms) {
  if(!email || !password || !modo) throw new Error("Preencha todos os campos.");
  if(!acceptTerms) throw new Error("Aceite os termos e condições.");
  if(!validateEmail(email)) throw new Error("Email inválido.");

  const cred = await createUserWithEmailAndPassword(auth,email,password);
  await setDoc(doc(db,"users",cred.user.uid),{
    email,
    modo,
    createdAt: new Date(),
    projects: [],
    premiumKey: null
  });

  // Redireciona após criar
  if(modo === "premium") window.location.href = "premium.html";
  else window.location.href = "app.html";

  return cred.user;
}

// =====================================
// Login
// =====================================
export async function login(email, password) {
  if(!email || !password) throw new Error("Preencha todos os campos.");
  const cred = await signInWithEmailAndPassword(auth,email,password);
  const snap = await getDoc(doc(db,"users",cred.user.uid));
  if(!snap.exists()) throw new Error("Perfil não encontrado.");
  const data = snap.data();

  if(data.modo === "premium") window.location.href = "premium.html";
  else window.location.href = "app.html";

  return data;
}

// =====================================
// Função de chat com a IA
// =====================================
export async function sendMessage(userId, message, language="pt") {
  try{
    const res = await fetch("https://vagalumeia-backend.onrender.com/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({userId, message, language})
    });
    const data = await res.json();
    return data.reply;
  }catch(err){
    console.error(err);
    return "Erro ao enviar mensagem.";
  }
}

// =====================================
// Upload documento
// =====================================
export async function uploadFile(userId, file, message) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  formData.append("message", message);

  try{
    const res = await fetch("https://vagalumeia-backend.onrender.com/upload",{
      method:"POST",
      body: formData
    });
    return await res.json();
  }catch(err){
    console.error(err);
    return { erro:"Erro ao enviar arquivo." };
  }
}

// =====================================
// Validar chave premium
// =====================================
export async function validatePremiumKey(userId, key) {
  try{
    const res = await fetch("https://vagalumeia-backend.onrender.com/check-key",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({userId, key})
    });
    return await res.json();
  }catch(err){
    console.error(err);
    return { valid:false, message:"Erro ao validar chave." };
  }
}

// =====================================
// Validação de email
// =====================================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}
