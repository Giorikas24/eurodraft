"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username, email, points: 0, createdAt: new Date(),
      });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("email-already-in-use")) setError("Το email χρησιμοποιείται ήδη.");
      else if (err instanceof Error && err.message.includes("weak-password")) setError("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
      else setError("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: userCredential.user.displayName,
        email: userCredential.user.email,
        points: 0, createdAt: new Date(),
      }, { merge: true });
      router.push("/");
    } catch { setError("Κάτι πήγε στραβά με το Google login."); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-black border-2 border-white/10 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all font-normal";

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>

      {/* Court lines bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-white"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-5 border-2 border-white/10 bg-black overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white px-6 py-5 text-center">
          <a href="/" className="inline-flex items-center gap-0 mb-2">
            <div className="bg-[#ff751f] px-2.5 py-1.5">
              <span className="text-black font-black text-base tracking-tighter">COURT</span>
            </div>
            <div className="bg-black px-2.5 py-1.5">
              <span className="text-white font-black text-base tracking-tighter">PROPHET</span>
            </div>
          </a>
          <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mt-2">Δημιούργησε τον λογαριασμό σου δωρεάν</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-3 text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-50 transition-all border-2 border-white"
          >
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Εγγραφή με Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">ή με email</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className={inputCls} style={{ fontFamily: "Arial, sans-serif" }}
                placeholder="το username σου" required />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} style={{ fontFamily: "Arial, sans-serif" }}
                placeholder="email@example.com" required />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Κωδικός</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className={inputCls} style={{ fontFamily: "Arial, sans-serif" }}
                placeholder="τουλάχιστον 6 χαρακτήρες" required />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-red-400 border-l-4 border-red-500 pl-3 py-1 font-black uppercase tracking-wide"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#ff751f] text-black font-black py-3 text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f] flex items-center justify-center gap-2 mt-1">
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : "Εγγραφή →"}
            </button>
          </form>

          <p className="text-center text-[10px] text-gray-600 font-black uppercase tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
            Έχεις ήδη λογαριασμό;{" "}
            <a href="/auth/login" className="text-[#ff751f] hover:underline">Σύνδεση</a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}