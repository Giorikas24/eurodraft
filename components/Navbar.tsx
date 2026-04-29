"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <nav className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/[0.04]">
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 h-14 flex items-center justify-between">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#ff751f] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(255,117,31,0.4)] group-hover:shadow-[0_0_20px_rgba(255,117,31,0.6)] transition-all">
              <span className="text-black font-black text-xs">CP</span>
            </div>
            <span className="font-black text-white tracking-tight text-base">
              Court<span className="text-[#ff751f]">Prophet</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive(link.href)
                    ? "text-white bg-white/[0.06]"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}>
                {isActive(link.href) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff751f]"></span>
                )}
                {link.label}
              </a>
            ))}
            {user?.email === ADMIN_EMAIL && (
              <a href="/admin"
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith("/admin")
                    ? "text-[#ff751f] bg-[rgba(255,117,31,0.08)]"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}>
                Admin
              </a>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <a href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
                  <div className="w-6 h-6 rounded-full bg-[#ff751f] flex items-center justify-center text-black font-black text-[10px]">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-300 font-medium">{user.displayName || user.email?.split("@")[0]}</span>
                </a>
                <button onClick={handleSignOut}
                  className="text-xs px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-all border border-white/[0.06]">
                  Έξοδος
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/auth/login"
                  className="text-xs px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-all">
                  Σύνδεση
                </a>
                <a href="/auth/register"
                  className="text-xs px-4 py-2 rounded-lg bg-[#ff751f] text-black font-black hover:bg-[#ff8534] transition-all shadow-[0_0_16px_rgba(255,117,31,0.3)]">
                  Εγγραφή
                </a>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            {user && (
              <div className="w-7 h-7 rounded-full bg-[#ff751f] flex items-center justify-center text-black font-black text-[10px]">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all">
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="7" x2="21" y2="7"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="9" y1="17" x2="21" y2="17"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 bg-[#070707]/98 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="px-4 py-3 flex flex-col gap-0.5">
              {navLinks.map(link => (
                <a key={link.href} href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-3 rounded-xl text-sm transition-all ${
                    isActive(link.href)
                      ? "text-white bg-white/[0.06] font-medium"
                      : "text-gray-500"
                  }`}>
                  {link.label}
                  {isActive(link.href) && <span className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></span>}
                </a>
              ))}
              {user?.email === ADMIN_EMAIL && (
                <a href="/admin" onClick={() => setMenuOpen(false)}
                  className={`py-3 px-3 rounded-xl text-sm transition-all ${
                    pathname.startsWith("/admin") ? "text-[#ff751f] bg-[rgba(255,117,31,0.06)] font-medium" : "text-gray-500"
                  }`}>
                  Admin
                </a>
              )}
              <div className="border-t border-white/[0.04] mt-2 pt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff751f] flex items-center justify-center text-black font-black text-xs">
                        {user.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm text-white font-medium">{user.displayName || user.email?.split("@")[0]}</span>
                    </div>
                    <button onClick={handleSignOut}
                      className="text-sm py-3 px-3 rounded-xl border border-white/[0.06] text-gray-500 text-left hover:text-gray-300 transition-all">
                      Έξοδος
                    </button>
                  </>
                ) : (
                  <>
                    <a href="/auth/login" onClick={() => setMenuOpen(false)}
                      className="text-sm py-3 px-3 rounded-xl border border-white/[0.06] text-white text-center">
                      Σύνδεση
                    </a>
                    <a href="/auth/register" onClick={() => setMenuOpen(false)}
                      className="text-sm py-3 px-3 rounded-xl bg-[#ff751f] text-black font-black text-center">
                      Εγγραφή
                    </a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}