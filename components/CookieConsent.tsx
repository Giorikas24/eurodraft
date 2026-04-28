"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
        >
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl p-5 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-lg flex-shrink-0">🍪</div>
              <div>
                <div className="text-sm font-black text-white mb-1">Χρησιμοποιούμε Cookies</div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σου. Διάβασε την{" "}
                  <a href="/privacy" className="text-[#ff751f] hover:underline">Πολιτική Απορρήτου</a>{" "}
                  και τους{" "}
                  <a href="/terms" className="text-[#ff751f] hover:underline">Όρους Χρήσης</a>.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={accept}
                className="flex-1 bg-[#ff751f] text-black font-black py-2.5 rounded-xl text-sm hover:bg-[#e6671a] transition-all shadow-[0_0_20px_rgba(255,117,31,0.2)]">
                Αποδοχή
              </button>
              <button onClick={decline}
                className="flex-1 border border-[#2a2a2a] text-gray-400 font-bold py-2.5 rounded-xl text-sm hover:bg-[#151515] transition-all">
                Απόρριψη
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}