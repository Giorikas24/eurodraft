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

  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">Φόρτωση...</div>;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center px-10 gap-4">
        <a href="/" className="font-bold text-2xl tracking-widest">
          <span className="text-[#ff751f]">COURT</span>
          <span className="text-white">PROPHET</span>
        </a>
        <span className="text-xs text-gray-500 border border-[#333] px-2 py-1 rounded">ADMIN</span>
      </nav>

      <div className="max-w-4xl mx-auto px-10 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse"></div>
            <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">COURTPROPHET</span>
          </div>
          <h1 className="text-3xl font-black mb-8">Admin Panel</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.a initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            href="/admin/matchdays"
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#ff751f]/40 hover:shadow-[0_0_30px_rgba(255,117,31,0.07)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-xl mb-4">🏀</div>
            <div className="text-lg font-black mb-1 group-hover:text-[#ff751f] transition-colors">Αγωνιστικές</div>
            <div className="text-sm text-gray-500">Δημιούργησε αγωνιστικές και πρόσθεσε ματς με HCP/OU</div>
          </motion.a>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-xl mb-4">⚡</div>
            <div className="text-lg font-black mb-1">Εβδομαδιαίο Challenge</div>
            <div className="text-sm text-gray-500 mb-4">Ορισμός challenge και bonus πόντων</div>
            <form onSubmit={handleSaveChallenge} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block uppercase tracking-widest">Περιγραφή challenge</label>
                <input type="text" value={challengeText} onChange={(e) => setChallengeText(e.target.value)}
                  className="w-full bg-[#151515] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-colors"
                  placeholder="π.χ. Βρες 5 σωστά αποτελέσματα" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block uppercase tracking-widest">Σωστές προβλέψεις</label>
                  <input type="number" value={challengeRequired} onChange={(e) => setChallengeRequired(e.target.value)}
                    className="w-full bg-[#151515] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-colors"
                    placeholder="π.χ. 5" required />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block uppercase tracking-widest">Bonus πόντοι</label>
                  <input type="number" value={challengeBonus} onChange={(e) => setChallengeBonus(e.target.value)}
                    className="w-full bg-[#151515] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-colors"
                    placeholder="π.χ. 10" required />
                </div>
              </div>
              {challengeRequired && challengeBonus && (
                <div className="bg-[rgba(255,117,31,0.06)] border border-[rgba(255,117,31,0.15)] rounded-xl px-4 py-2.5 text-xs text-gray-400">
                  ⚡ Παίκτες με <span className="text-[#ff751f] font-bold">{challengeRequired}+</span> σωστές προβλέψεις κερδίζουν <span className="text-[#ff751f] font-bold">+{challengeBonus} πτς</span>
                </div>
              )}
              <div className="bg-[rgba(74,222,128,0.06)] border border-[rgba(74,222,128,0.15)] rounded-xl px-4 py-2.5 text-xs text-gray-400">
                🎯 100% ακρίβεια → αυτόματο bonus <span className="text-green-400 font-bold">+10 πτς</span>
              </div>
              <button type="submit" disabled={savingChallenge}
                className={`font-black px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 ${
                  challengeSaved
                    ? "bg-green-500 text-black"
                    : "bg-[#ff751f] text-black hover:bg-[#e6671a] shadow-[0_0_20px_rgba(255,117,31,0.2)]"
                }`}>
                {challengeSaved ? "✓ Αποθηκεύτηκε!" : savingChallenge ? "Αποθήκευση..." : "Αποθήκευσε"}
              </button>
            </form>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
          <div className="text-xs text-gray-600 uppercase tracking-widest mb-4 font-bold">Γρήγορες συνδέσεις</div>
          <div className="flex gap-3 flex-wrap">
            {[
              { href: "/leaderboard", label: "Κατάταξη" },
              { href: "/cup", label: "Κύπελλο" },
              { href: "/", label: "Homepage" },
            ].map(link => (
              <a key={link.href} href={link.href}
                className="text-xs border border-[#1e1e1e] text-gray-400 px-4 py-2 rounded-xl hover:border-[#ff751f] hover:text-[#ff751f] transition-all">
                {link.label} →
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}