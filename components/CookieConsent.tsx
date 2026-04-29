"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => { localStorage.setItem("cookie_consent", "accepted"); setVisible(false); };
  const decline = () => { localStorage.setItem("cookie_consent", "declined"); setVisible(false); };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50"
          style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
        >
          <div className="bg-black border-2 border-[#ff751f]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="bg-[#ff751f] px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🍪</span>
              <span className="text-black text-[9px] font-black uppercase tracking-[4px]">Cookies</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 leading-relaxed mb-4" style={{ fontFamily: "Arial, sans-serif" }}>
                Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σου. Διάβασε την{" "}
                <a href="/privacy" className="text-[#ff751f] hover:underline font-black">Πολιτική Απορρήτου</a>{" "}
                και τους{" "}
                <a href="/terms" className="text-[#ff751f] hover:underline font-black">Όρους Χρήσης</a>.
              </p>
              <div className="flex gap-0">
                <button onClick={accept}
                  className="flex-1 bg-[#ff751f] text-black font-black py-2.5 text-[10px] uppercase tracking-widest hover:bg-white transition-all border-2 border-[#ff751f]">
                  Αποδοχή
                </button>
                <button onClick={decline}
                  className="flex-1 border-2 border-white/10 text-gray-500 font-black py-2.5 text-[10px] uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">
                  Απόρριψη
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}