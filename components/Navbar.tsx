"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-10 flex items-center justify-between">
        <a href="/" className="font-bold text-2xl tracking-widest">
          <span className="text-[#ff751f]">EURO</span>
          <span className="text-white">DRAFT</span>
        </a>
        <div className="flex gap-8">
          <a href="#" className="text-[#ff751f] text-sm">Αγωνιστική</a>
          <a href="/leaderboard" className="text-gray-400 text-sm hover:text-white">Κατάταξη</a>
          <a href="#" className="text-gray-400 text-sm hover:text-white">Κύπελλο</a>
          <a href="#" className="text-gray-400 text-sm hover:text-white">Ιδιωτικά</a>
          <a href="#" className="text-gray-400 text-sm hover:text-white">Chat</a>
          <a href="#" className="text-gray-400 text-sm hover:text-white">Κανόνες</a>
        </div>
        <div className="flex gap-3 items-center">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff751f] flex items-center justify-center text-black font-medium text-sm">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-white">{user.displayName || user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm px-4 py-2 rounded-md border border-[#333] text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                Έξοδος
              </button>
            </div>
          ) : (
            <>
              <a href="/auth/login" className="text-sm px-4 py-2 rounded-md border border-[#333] text-white hover:bg-[#1a1a1a]">Σύνδεση</a>
              <a href="/auth/register" className="text-sm px-4 py-2 rounded-md bg-[#ff751f] text-black font-medium hover:bg-[#e6671a]">Εγγραφή</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}