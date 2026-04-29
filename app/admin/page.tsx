"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [challengeText, setChallengeText] = useState("");
  const [challengeBonus, setChallengeBonus] = useState("");
  const [challengeRequired, setChallengeRequired] = useState("");
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [challengeSaved, setChallengeSaved] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchChallenge();
  }, [user]);

  const fetchChallenge = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "weeklyChallenge"));
      if (snap.exists()) {
        setChallengeText(snap.data().text || "");
        setChallengeBonus(String(snap.data().bonus || ""));
        setChallengeRequired(String(snap.data().requiredCorrect || ""));
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChallenge(true);
    try {
      await setDoc(doc(db, "config", "weeklyChallenge"), {
        text: challengeText,
        bonus: parseInt(challengeBonus),
        requiredCorrect: parseInt(challengeRequired),
        updatedAt: new Date(),
      });
      setChallengeSaved(true);
      setTimeout(() => setChallengeSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSavingChallenge(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <div className="w-6 h-6 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>

      {/* Admin Navbar */}
      <nav className="bg-black border-b-2 border-[#ff751f] h-14 flex items-center px-10 gap-0">
        <a href="/" className="flex items-center gap-0 mr-4">
          <div className="bg-[#ff751f] px-2.5 py-1.5">
            <span className="text-black font-black text-sm tracking-tighter">COURT</span>
          </div>
          <div className="bg-white px-2.5 py-1.5">
            <span className="text-black font-black text-sm tracking-tighter">PROPHET</span>
          </div>
        </a>
        <div className="bg-white/10 px-3 py-1.5 border border-white/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Panel</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-10 py-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <div className="flex items-center gap-0 mb-3">
            <div className="bg-[#ff751f] px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
            </div>
            <div className="bg-white px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Control Room</span>
            </div>
          </div>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tighter">
            AD<span className="text-[#ff751f]">MIN</span>
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Matchdays */}
          <motion.a initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            href="/admin/matchdays"
            className="border-2 border-white/10 bg-black p-6 hover:border-[#ff751f]/50 transition-all group overflow-hidden">
            <div className="h-0.5 bg-[#ff751f] scale-x-0 group-hover:scale-x-100 transition-transform origin-left mb-4"></div>
            <div className="text-4xl mb-4">🏀</div>
            <div className="text-lg font-black uppercase group-hover:text-[#ff751f] transition-colors mb-1">Αγωνιστικές</div>
            <div className="text-xs text-gray-600 font-black uppercase tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
              Δημιούργησε αγωνιστικές · HCP · O/U
            </div>
            <div className="mt-4 text-[10px] text-[#ff751f] font-black uppercase tracking-widest">
              Διαχείριση →
            </div>
          </motion.a>

          {/* Challenge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="border-2 border-white/10 bg-black overflow-hidden">
            <div className="bg-[#ff751f] px-4 py-2">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">⚡ Weekly Challenge</span>
            </div>
            <div className="p-5">
              <form onSubmit={handleSaveChallenge} className="flex flex-col gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>
                    Περιγραφή
                  </label>
                  <input type="text" value={challengeText} onChange={(e) => setChallengeText(e.target.value)}
                    className="w-full bg-white/5 border-2 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all"
                    style={{ fontFamily: "Arial, sans-serif" }}
                    placeholder="π.χ. Βρες 5 σωστά" required />
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <div className="border-2 border-white/10 p-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>
                      Σωστές
                    </label>
                    <input type="number" value={challengeRequired} onChange={(e) => setChallengeRequired(e.target.value)}
                      className="w-full bg-transparent text-white text-lg font-black focus:outline-none tabular-nums"
                      placeholder="5" required />
                  </div>
                  <div className="border-2 border-white/10 border-l-0 p-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>
                      Bonus πτς
                    </label>
                    <input type="number" value={challengeBonus} onChange={(e) => setChallengeBonus(e.target.value)}
                      className="w-full bg-transparent text-[#ff751f] text-lg font-black focus:outline-none tabular-nums"
                      placeholder="10" required />
                  </div>
                </div>

                {challengeRequired && challengeBonus && (
                  <div className="border-l-4 border-[#ff751f] pl-3 py-1">
                    <span className="text-[10px] font-black text-gray-400" style={{ fontFamily: "Arial, sans-serif" }}>
                      {challengeRequired}+ σωστές → <span className="text-[#ff751f]">+{challengeBonus} πτς</span>
                    </span>
                  </div>
                )}

                <div className="border-l-4 border-green-500 pl-3 py-1">
                  <span className="text-[10px] font-black text-gray-400" style={{ fontFamily: "Arial, sans-serif" }}>
                    100% ακρίβεια → <span className="text-green-400">+10 πτς αυτόματα</span>
                  </span>
                </div>

                <button type="submit" disabled={savingChallenge}
                  className={`font-black px-6 py-3 text-xs uppercase tracking-widest transition-all disabled:opacity-50 border-2 ${
                    challengeSaved
                      ? "bg-green-500 border-green-500 text-black"
                      : "bg-[#ff751f] border-[#ff751f] text-black hover:bg-white hover:border-white"
                  }`}>
                  {challengeSaved ? "✓ Αποθηκεύτηκε!" : savingChallenge ? "..." : "Αποθήκευσε"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="border-2 border-white/10 bg-black overflow-hidden">
          <div className="bg-white px-4 py-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Quick Links</span>
          </div>
          <div className="p-4 flex gap-0 flex-wrap">
            {[
              { href: "/leaderboard", label: "Κατάταξη" },
              { href: "/cup", label: "Κύπελλο" },
              { href: "/", label: "Homepage" },
            ].map((link, i) => (
              <a key={link.href} href={link.href}
                className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 border-r border-white/10 last:border-r-0 hover:text-[#ff751f] hover:bg-white/5 transition-all">
                {link.label} →
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}