"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
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
        const picks = pred.picks || {};
        const gamesSnap = await getDocs(collection(db, "matchdays", pred.matchdayId, "games"));
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
        if (total > 0) mdStats.push({ matchdayNumber: matchdaysMap[pred.matchdayId] || 0, correct, total, points });
      }
      mdStats.sort((a, b) => b.matchdayNumber - a.matchdayNumber);
      setMatchdayStats(mdStats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const badge = rank > 0 && totalUsers > 0 ? getBadge(rank, totalUsers) : null;
  const totalCorrect = matchdayStats.reduce((s, m) => s + m.correct, 0);
  const totalPredictions = matchdayStats.reduce((s, m) => s + m.total, 0);
  const accuracy = totalPredictions > 0 ? Math.round((totalCorrect / totalPredictions) * 100) : 0;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        {/* Header */}
        <div className="relative overflow-hidden border-b border-[#1a1a1a]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#ff751f] opacity-[0.05] blur-[100px] rounded-full"></div>
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: "linear-gradient(#ff751f 1px, transparent 1px), linear-gradient(90deg, #ff751f 1px, transparent 1px)",
              backgroundSize: "60px 60px"
            }}></div>
          </div>
          <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-10 relative">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
                <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Προφίλ</h1>
            </motion.div>
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-10">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3].map(i => <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl h-24 animate-pulse"></div>)}
            </div>
          ) : (
            <>
              {/* Profile card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 md:p-8 mb-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff751f] to-transparent opacity-50"></div>
                <div className="absolute top-[-30px] right-[-30px] w-[150px] h-[150px] bg-[#ff751f] opacity-[0.04] blur-[60px] rounded-full"></div>
                <div className="flex items-center gap-5 relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#ff751f] to-[#cc5500] flex items-center justify-center text-black text-2xl md:text-3xl font-black flex-shrink-0 shadow-[0_0_30px_rgba(255,117,31,0.3)]">
                    {stats?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl md:text-2xl font-black truncate">{stats?.username}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{stats?.email}</div>
                    {badge && (
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black mt-2 inline-block ${badge.class}`}>{badge.label}</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl md:text-4xl font-black text-[#ff751f] drop-shadow-[0_0_10px_rgba(255,117,31,0.5)]">#{rank}</div>
                    <div className="text-xs text-gray-500 tracking-widest uppercase mt-1">κατάταξη</div>
                  </div>
                </div>
              </motion.div>

              {/* Stats grid */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { value: stats?.points || 0, label: "ΠΟΝΤΟΙ", orange: true, suffix: "" },
                  { value: accuracy, label: "ΑΚΡΙΒΕΙΑ", orange: false, suffix: "%" },
                  { value: totalCorrect + "/" + totalPredictions, label: "ΣΩΣΤΕΣ", orange: false, suffix: "" },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                    className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 md:p-5 text-center hover:border-[#2a2a2a] transition-all">
                    <div className={`text-2xl md:text-3xl font-black ${s.orange ? "text-[#ff751f] drop-shadow-[0_0_8px_rgba(255,117,31,0.4)]" : "text-white"}`}>
                      {s.value}{s.suffix}
                    </div>
                    <div className="text-[10px] tracking-[3px] text-gray-600 mt-1.5 font-bold">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Accuracy bar */}
              {totalPredictions > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500 font-medium">Συνολική ακρίβεια</span>
                    <span className="text-sm text-[#ff751f] font-black">{accuracy}%</span>
                  </div>
                  <div className="h-2 bg-[#151515] rounded-full overflow-hidden border border-[#1a1a1a]">
                    <motion.div className="h-2 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c] rounded-full shadow-[0_0_8px_rgba(255,117,31,0.5)]"
                      initial={{ width: 0 }} animate={{ width: accuracy + "%" }} transition={{ duration: 0.8, delay: 0.4 }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-gray-700">0%</span>
                    <span className="text-[10px] text-gray-700">100%</span>
                  </div>
                </motion.div>
              )}

              {/* Matchday history */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-black text-white">Ιστορικό αγωνιστικών</h2>
                  <span className="text-xs text-gray-600 bg-[#151515] border border-[#1a1a1a] px-2 py-0.5 rounded-full">{matchdayStats.length}</span>
                </div>
                {matchdayStats.length === 0 ? (
                  <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-10 text-center">
                    <div className="text-4xl mb-3">🏀</div>
                    <div className="text-gray-500 text-sm">Δεν υπάρχουν ολοκληρωμένες αγωνιστικές ακόμα.</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {matchdayStats.map((m, i) => {
                      const pct = Math.round((m.correct / m.total) * 100);
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-5 py-4 flex items-center justify-between hover:border-[#2a2a2a] transition-all"
                        >
                          <div>
                            <div className="text-sm font-black">Αγωνιστική #{m.matchdayNumber}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{m.correct}/{m.total} σωστές · {pct}%</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden md:block">
                              <div className="h-1.5 w-24 bg-[#151515] rounded-full overflow-hidden border border-[#1a1a1a]">
                                <motion.div className="h-1.5 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c] rounded-full"
                                  initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.6, delay: 0.1 * i }} />
                              </div>
                            </div>
                            <span className={`text-sm font-black px-3 py-1 rounded-xl ${
                              m.points >= 0
                                ? "text-[#ff751f] bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)]"
                                : "text-red-400 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]"
                            }`}>
                              {m.points >= 0 ? "+" : ""}{m.points} πτς
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