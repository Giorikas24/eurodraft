"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
    setMenuOpen(false);
  };

  const active = "text-sm text-[#ff751f]";
  const inactive = "text-sm text-gray-400 hover:text-white";

  const navLinks = [
    { href: "/", label: "Αγωνιστική" },
    { href: "/leaderboard", label: "Κατάταξη" },
    { href: "/cup", label: "Κύπελλο" },
    { href: "/private", label: "Ιδιωτικά" },
    { href: "/chat", label: "Chat" },
    { href: "/rules", label: "Κανόνες" },
    { href: "/profile", label: "Προφίλ" },
  ];

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center justify-center sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between">
          <a href="/" className="font-bold text-xl md:text-2xl tracking-widest">
            <span className="text-[#ff751f]">EURO</span>
            <span className="text-white">DRAFT</span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={isActive(link.href) ? active : inactive}>
                {link.label}
              </a>
            ))}
            {user?.email === ADMIN_EMAIL && (
              <a href="/admin" className={pathname.startsWith("/admin") ? active : inactive}>Admin</a>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex gap-3 items-center">
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

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-3">
            {user && (
              <div className="w-8 h-8 rounded-full bg-[#ff751f] flex items-center justify-center text-black font-medium text-sm">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
              </div>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-1">
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black border-b border-[#1a1a1a] z-40 sticky top-16">
          <div className="flex flex-col px-5 py-4 gap-1">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 px-3 rounded-lg text-sm ${isActive(link.href) ? "text-[#ff751f] bg-[rgba(255,117,31,0.08)]" : "text-gray-400"}`}>
                {link.label}
              </a>
            ))}
            {user?.email === ADMIN_EMAIL && (
              <a href="/admin" onClick={() => setMenuOpen(false)}
                className={`py-3 px-3 rounded-lg text-sm ${pathname.startsWith("/admin") ? "text-[#ff751f] bg-[rgba(255,117,31,0.08)]" : "text-gray-400"}`}>
                Admin
              </a>
            )}
            <div className="border-t border-[#1a1a1a] mt-2 pt-3">
              {user ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white px-3">{user.displayName || user.email}</span>
                  <button onClick={handleSignOut}
                    className="text-sm px-3 py-2.5 rounded-lg border border-[#333] text-gray-400 text-left hover:bg-[#1a1a1a]">
                    Έξοδος
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <a href="/auth/login" onClick={() => setMenuOpen(false)}
                    className="text-sm px-3 py-2.5 rounded-lg border border-[#333] text-white text-center">
                    Σύνδεση
                  </a>
                  <a href="/auth/register" onClick={() => setMenuOpen(false)}
                    className="text-sm px-3 py-2.5 rounded-lg bg-[#ff751f] text-black font-medium text-center">
                    Εγγραφή
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}