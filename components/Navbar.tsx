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
      <nav className="sticky top-0 z-50 bg-black border-b-2 border-[#ff751f]" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 h-14 flex items-center justify-between">

          {/* Logo */}
<a href="/" className="flex items-center group">
  <img src="/logowhite.png" alt="CourtProphet" className="h-9 w-9 object-contain" />
</a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                className={`px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-r border-white/10 ${
                  isActive(link.href)
                    ? "text-black bg-[#ff751f]"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}>
                {link.label}
              </a>
            ))}
            {user?.email === ADMIN_EMAIL && (
              <a href="/admin"
                className={`px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                  pathname.startsWith("/admin")
                    ? "text-black bg-[#ff751f]"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}>
                Admin
              </a>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-0">
            {loading ? (
              <div className="w-8 h-8 bg-white/5 animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-0">
                <a href="/profile" className="flex items-center gap-2 px-4 py-3 border-l border-white/10 hover:bg-white/5 transition-all">
                  <div className="w-6 h-6 bg-[#ff751f] flex items-center justify-center text-black font-black text-[10px]">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-[10px] text-white font-black uppercase tracking-wider">{user.displayName || user.email?.split("@")[0]}</span>
                </a>
                <button onClick={handleSignOut}
                  className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 border-l border-white/10 hover:text-white hover:bg-white/5 transition-all">
                  Έξοδος
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-0">
                <a href="/auth/login"
                  className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 border-l border-white/10 hover:text-white hover:bg-white/5 transition-all">
                  Σύνδεση
                </a>
                <a href="/auth/register"
                  className="px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-[#ff751f] text-black hover:bg-white transition-all">
                  Εγγραφή
                </a>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            {user && (
              <div className="w-7 h-7 bg-[#ff751f] flex items-center justify-center text-black font-black text-[10px]">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-all">
              {menuOpen ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 bg-black border-b-2 border-[#ff751f]"
            style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
          >
            <div className="flex flex-col">
              {navLinks.map(link => (
                <a key={link.href} href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between py-4 px-5 border-b border-white/10 text-xs font-black uppercase tracking-widest transition-all ${
                    isActive(link.href)
                      ? "bg-[#ff751f] text-black"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}>
                  {link.label}
                  {isActive(link.href) && <span className="text-black">▶</span>}
                </a>
              ))}
              {user?.email === ADMIN_EMAIL && (
                <a href="/admin" onClick={() => setMenuOpen(false)}
                  className={`py-4 px-5 border-b border-white/10 text-xs font-black uppercase tracking-widest transition-all ${
                    pathname.startsWith("/admin") ? "bg-[#ff751f] text-black" : "text-gray-500"
                  }`}>
                  Admin
                </a>
              )}
              <div className="flex flex-col">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                      <div className="w-8 h-8 bg-[#ff751f] flex items-center justify-center text-black font-black text-xs">
                        {user.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs text-white font-black uppercase tracking-wider">{user.displayName || user.email?.split("@")[0]}</span>
                    </div>
                    <button onClick={handleSignOut}
                      className="py-4 px-5 text-xs font-black uppercase tracking-widest text-gray-600 text-left hover:text-white hover:bg-white/5 transition-all">
                      Έξοδος
                    </button>
                  </>
                ) : (
                  <div className="flex">
                    <a href="/auth/login" onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center py-4 text-xs font-black uppercase tracking-widest border-r border-white/10 text-white hover:bg-white/5 transition-all">
                      Σύνδεση
                    </a>
                    <a href="/auth/register" onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center py-4 text-xs font-black uppercase tracking-widest bg-[#ff751f] text-black hover:bg-white transition-all">
                      Εγγραφή
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}