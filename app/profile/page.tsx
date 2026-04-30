"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getBadge } from "@/lib/badges";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";

interface UserStats {
  username: string;
  email: string;
  points: number;
  createdAt: any;
}

interface MatchdayStats {
  matchdayNumber: number;
  correct: number;
  total: number;
  points: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [matchdayStats, setMatchdayStats] = useState<MatchdayStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setStats(userDoc.data() as UserStats);

      const allUsersSnap = await getDocs(query(collection(db, "users")));
      const allUsers = allUsersSnap.docs.map(d => ({ id: d.id, points: d.data().points || 0 }));
      allUsers.sort((a, b) => b.points - a.points);
      setTotalUsers(allUsers.length);
      setRank(allUsers.findIndex(u => u.id === user.uid) + 1);

      const predictionsSnap = await getDocs(query(collection(db, "predictions"), where("userId", "==", user.uid)));
      const matchdaysSnap = await getDocs(collection(db, "matchdays"));
      const matchdaysMap: Record<string, number> = {};
      matchdaysSnap.docs.forEach(d => { matchdaysMap[d.id] = d.data().number; });

      const mdStats: MatchdayStats[] = [];
      for (const predDoc of predictionsSnap.docs) {
        const pred = predDoc.data();
        const matchdayId = pred.matchdayId;
        const picks = pred.picks || {};
        const gamesSnap = await getDocs(collection(db, "matchdays", matchdayId, "games"));
        let correct = 0, total = 0, points = 0;
        gamesSnap.docs.forEach(g => {
          const game = g.data();
          if (game.status === "finished" && picks[g.id]) {
            total++;
            if (picks[g.id] === game.result) {
              correct++;
              points += game.result === "home" ? game.homePoints : game.awayPoints;
            } else { points -= 1; }
          }
        });
        if (total > 0) mdStats.push({ matchdayNumber: matchdaysMap[matchdayId] || 0, correct, total, points });
      }
      mdStats.sort((a, b) => b.matchdayNumber - a.matchdayNumber);
      setMatchdayStats(mdStats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSaveUsername = async () => {
    if (!user || !newUsername.trim()) return;
    if (newUsername.trim().length < 3) { setUsernameError("Τουλάχιστον 3 χαρακτήρες."); return; }
    if (newUsername.trim().length > 20) { setUsernameError("Μέχρι 20 χαρακτήρες."); return; }

    setSavingUsername(true);
    setUsernameError("");
    try {
      // Check if username already taken
      const q = query(collection(db, "users"), where("username", "==", newUsername.trim()));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].id !== user.uid) {
        setUsernameError("Αυτό το username χρησιμοποιείται ήδη.");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), { username: newUsername.trim() });
      await updateProfile(user, { displayName: newUsername.trim() });
      setStats(prev => prev ? { ...prev, username: newUsername.trim() } : prev);
      setUsernameSuccess(true);
      setEditingUsername(false);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err) { console.error(err); setUsernameError("Κάτι πήγε στραβά."); }
    finally { setSavingUsername(false); }
  };

  const badge = rank > 0 && totalUsers > 0 ? getBadge(rank, totalUsers) : null;
  const totalCorrect = matchdayStats.reduce((s, m) => s + m.correct, 0);
  const totalPredictions = matchdayStats.reduce((s, m) => s + m.total, 0);
  const accuracy = totalPredictions > 0 ? Math.round((totalCorrect / totalPredictions) * 100) : 0;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
        <Navbar />

        {/* Header */}
        <div className="bg-black border-b-2 border-[#ff751f]">
          <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-0 mb-3">
                <div className="bg-[#ff751f] px-3 py-1">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
                </div>
                <div className="bg-white px-3 py-1">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Player Card</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                ΠΡΟ<span className="text-[#ff751f]">ΦΙΛ</span>
              </h1>
            </motion.div>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/[0.02] border-2 border-white/10 animate-pulse"></div>)}
            </div>
          ) : (
            <>
              {/* Player card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="border-2 border-white/10 bg-black mb-4 overflow-hidden">
                <div className="h-2 bg-[#ff751f]"></div>
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ff751f] flex items-center justify-center text-black text-3xl md:text-4xl font-black flex-shrink-0">
                      {stats?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl md:text-2xl font-black uppercase truncate">{stats?.username}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate" style={{ fontFamily: "Arial, sans-serif" }}>{stats?.email}</div>
                      {badge && (
                        <span className={`text-[8px] px-2 py-0.5 font-black mt-2 inline-block uppercase ${badge.class}`}>{badge.label}</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-4xl md:text-5xl font-black text-[#ff751f] leading-none tabular-nums">#{rank}</div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1" style={{ fontFamily: "Arial, sans-serif" }}>κατάταξη</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Change username */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="border-2 border-white/10 bg-black mb-4 overflow-hidden">
                <div className="bg-white px-4 py-2 flex items-center justify-between">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Αλλαγή Username</span>
                  {usernameSuccess && (
                    <span className="text-green-600 text-[9px] font-black uppercase tracking-widest">✓ Αποθηκεύτηκε!</span>
                  )}
                </div>
                <div className="p-4">
                  {editingUsername ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => { setNewUsername(e.target.value); setUsernameError(""); }}
                        className="w-full bg-white/5 border-2 border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all font-black uppercase tracking-wide"
                        placeholder="Νέο username..."
                        maxLength={20}
                        autoFocus
                      />
                      {usernameError && (
                        <div className="text-[10px] text-red-400 border-l-4 border-red-500 pl-3 py-1 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>
                          {usernameError}
                        </div>
                      )}
                      <div className="flex gap-0">
                        <button onClick={handleSaveUsername} disabled={savingUsername}
                          className="flex-1 bg-[#ff751f] text-black font-black py-2.5 text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f]">
                          {savingUsername ? "..." : "Αποθήκευσε"}
                        </button>
                        <button onClick={() => { setEditingUsername(false); setUsernameError(""); }}
                          className="border-2 border-white/10 text-gray-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:border-white/30 transition-all">
                          Ακύρωση
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-black uppercase tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
                        Τρέχον: <span className="text-white">{stats?.username}</span>
                      </span>
                      <button onClick={() => { setEditingUsername(true); setNewUsername(stats?.username || ""); }}
                        className="text-[10px] font-black uppercase tracking-widest text-[#ff751f] border-2 border-[#ff751f]/30 px-3 py-2 hover:bg-[#ff751f] hover:text-black transition-all">
                        ✏️ Αλλαγή
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-0 mb-4 border-2 border-white/10 overflow-hidden">
                {[
                  { val: stats?.points || 0, label: "Πόντοι" },
                  { val: `${accuracy}%`, label: "Ακρίβεια" },
                  { val: `${totalCorrect}/${totalPredictions}`, label: "Σωστές" },
                ].map((s, i) => (
                  <div key={i} className={`p-4 md:p-5 text-center border-r border-white/10 last:border-r-0 ${i === 0 ? "bg-[#ff751f]" : "bg-black"}`}>
                    <div className={`text-2xl md:text-3xl font-black tabular-nums ${i === 0 ? "text-black" : "text-white"}`}>{s.val}</div>
                    <div className={`text-[9px] uppercase tracking-widest mt-1 font-black ${i === 0 ? "text-black/70" : "text-gray-600"}`} style={{ fontFamily: "Arial, sans-serif" }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Accuracy bar */}
              {totalPredictions > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="border-2 border-white/10 bg-black p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Συνολική Ακρίβεια</span>
                    <span className="text-[9px] font-black text-[#ff751f]">{accuracy}%</span>
                  </div>
                  <div className="h-2 bg-white/10 w-full">
                    <motion.div className="h-full bg-[#ff751f]"
                      initial={{ width: 0 }} animate={{ width: accuracy + "%" }} transition={{ duration: 0.8, delay: 0.4 }} />
                  </div>
                </motion.div>
              )}

              {/* History */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center gap-0 mb-4">
                  <div className="bg-white px-4 py-2">
                    <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Ιστορικό</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2">
                    <span className="text-white text-[9px] font-black tracking-[4px] uppercase">{matchdayStats.length} αγωνιστικές</span>
                  </div>
                </div>

                {matchdayStats.length === 0 ? (
                  <div className="border-2 border-white/10 bg-black p-10 text-center">
                    <div className="text-gray-600 text-xs uppercase font-black tracking-widest">Δεν υπάρχουν ολοκληρωμένες αγωνιστικές ακόμα.</div>
                  </div>
                ) : (
                  <div className="border-2 border-white/10 overflow-hidden">
                    {matchdayStats.map((m, i) => {
                      const pct = Math.round((m.correct / m.total) * 100);
                      const isGood = m.points >= 0;
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-white/[0.06] last:border-0 bg-black hover:bg-white/[0.02] transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 flex items-center justify-center text-xs font-black flex-shrink-0 ${isGood ? "bg-[#ff751f] text-black" : "bg-white/10 text-white"}`}>
                              #{m.matchdayNumber}
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase text-white">Αγωνιστική #{m.matchdayNumber}</div>
                              <div className="text-[10px] text-gray-600 mt-0.5 font-bold uppercase tracking-wider" style={{ fontFamily: "Arial, sans-serif" }}>
                                {m.correct}/{m.total} σωστές · {pct}% ακρίβεια
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-1 bg-white/10 hidden md:block">
                              <div className="h-full bg-[#ff751f]" style={{ width: pct + "%" }}></div>
                            </div>
                            <span className={`text-sm font-black tabular-nums ${isGood ? "text-[#ff751f]" : "text-red-400"}`}>
                              {isGood ? "+" : ""}{m.points} πτς
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}