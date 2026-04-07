"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        points: 0,
        createdAt: new Date(),
      });
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("email-already-in-use")) {
        setError("Το email χρησιμοποιείται ήδη.");
      } else if (err instanceof Error && err.message.includes("weak-password")) {
        setError("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
      } else {
        setError("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: userCredential.user.displayName,
        email: userCredential.user.email,
        points: 0,
        createdAt: new Date(),
      }, { merge: true });
      router.push("/");
    } catch {
      setError("Κάτι πήγε στραβά με το Google login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-md px-8 py-10 bg-[#111] rounded-2xl border border-[#1e1e1e]">

        <div className="text-center mb-8">
          <div className="font-bold text-3xl tracking-widest mb-2">
            <span className="text-[#ff751f]">EURO</span>
            <span className="text-white">DRAFT</span>
          </div>
          <p className="text-gray-500 text-sm">Δημιούργησε τον λογαριασμό σου</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 rounded-lg text-sm mb-6 hover:bg-gray-100 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Εγγραφή με Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#222]"></div>
          <span className="text-xs text-gray-600">ή με email</span>
          <div className="flex-1 h-px bg-[#222]"></div>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f]"
              placeholder="το username σου"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f]"
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Κωδικός</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f]"
              placeholder="τουλάχιστον 6 χαρακτήρες"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff751f] text-black font-medium py-3 rounded-lg text-sm hover:bg-[#e6671a] disabled:opacity-50 mt-2"
          >
            {loading ? "Εγγραφή..." : "Εγγραφή"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Έχεις ήδη λογαριασμό;{" "}
          <a href="/auth/login" className="text-[#ff751f] hover:underline">Σύνδεση</a>
        </p>
      </div>
    </main>
  );
}