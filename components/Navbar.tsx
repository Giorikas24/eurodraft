"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  const active = "text-sm text-[#ff751f]";
  const inactive = "text-sm text-gray-400 hover:text-white";

  return (
    <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-10 flex items-center justify-between">
        <a href="/" className="font-bold text-2xl tracking-widest">
          <span className="text-[#ff751f]">EURO</span>
          <span className="text-white">DRAFT</span>
        </a>
        <div className="flex gap-8">
          <a href="/" className={pathname === "/" ? active : inactive}>Αγωνιστική</a>
          <a href="/leaderboard" className={pathname === "/leaderboard" ? active : inactive}>Κατάταξη</a>
          <a href="/cup" className={pathname === "/cup" ? active : inactive}>Κύπελλο</a>
          <a href="/private" className={pathname === "/private" ? active : inactive}>Ιδιωτικά</a>
          <a href="/chat" className={pathname === "/chat" ? active : inactive}>Chat</a>
          <a href="/rules" className={pathname === "/rules" ? active : inactive}>Κανόνες</a>
          {user?.email === ADMIN_EMAIL && (
            <a href="/admin" className={pathname.startsWith("/admin") ? active : inactive}>Admin</a>
          )}
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
              <button onClick={handleSignOut} className="text-sm px-4 py-2 rounded-md border border-[#333] text-gray-400 hover:text-white hover:bg-[#1a1a1a]">
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