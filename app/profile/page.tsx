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

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

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
        let correct = 0;
        let total = 0;
        let points = 0;

        gamesSnap.docs.forEach(g => {
          const game = g.data();
          if (game.status === "finished" && picks[g.id]) {
            total++;
            if (picks[g.id] === game.result) {
              correct++;
              points += game.result === "home" ? game.homePoints : game.awayPoints;
            } else {
              points -= 1;
            }
          }
        });

        if (total > 0) {
          mdStats.push({
            matchdayNumber: matchdaysMap[matchdayId] || 0,
            correct,
            total,
            points,
          });
        }
      }

      mdStats.sort((a, b) => b.matchdayNumber - a.matchdayNumber);
      setMatchdayStats(mdStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const badge = rank > 0 && totalUsers > 0 ? getBadge(rank, totalUsers) : null;
  const totalCorrect = matchdayStats.reduce((s, m) => s + m.correct, 0);
  const totalPredictions = matchdayStats.reduce((s, m) => s + m.total, 0);
  const accuracy = totalPredictions > 0 ? Math.round((totalCorrect / totalPredictions) * 100) : 0;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />

        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f] animate-pulse"></div>
              <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-medium mb-6 md:mb-8">Προφίλ</h1>
          </motion.div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3].map(i => <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl h-24 animate-pulse"></div>)}
            </div>
          ) : (
            <>
              {/* Profile card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#ff751f] flex items-center justify-center text-black text-2xl font-bold flex-shrink-0">
                    {stats?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg md:text-xl font-medium truncate">{stats?.username}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{stats?.email}</div>
                    {badge && (
                      <span className={`text-[9px] px-2 py-0.5 rounded font-medium mt-2 inline-block ${badge.class}`}>{badge.label}</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl md:text-3xl font-medium text-[#ff751f]">#{rank}</div>
                    <div className="text-xs text-gray-500">κατάταξη</div>
                  </div>
                </div>
              </motion.div>

              {/* Stats grid */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
                  <div className="text-2xl font-medium text-[#ff751f]">{stats?.points || 0}</div>
                  <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΠΟΝΤΟΙ</div>
                </div>
                <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
                  <div className="text-2xl font-medium text-white">{accuracy}%</div>
                  <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΑΚΡΙΒΕΙΑ</div>
                </div>
                <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
                  <div className="text-2xl font-medium text-white">{totalCorrect}/{totalPredictions}</div>
                  <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΣΩΣΤΕΣ</div>
                </div>
              </motion.div>

              {/* Accuracy bar */}
              {totalPredictions > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Συνολική ακρίβεια</span>
                    <span className="text-xs text-[#ff751f] font-medium">{accuracy}%</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div className="h-2 bg-[#ff751f] rounded-full"
                      initial={{ width: 0 }} animate={{ width: accuracy + "%" }} transition={{ duration: 0.8, delay: 0.4 }} />
                  </div>
                </motion.div>
              )}

              {/* Matchday history */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="text-base font-medium text-gray-400 mb-3">Ιστορικό αγωνιστικών</h2>
                {matchdayStats.length === 0 ? (
                  <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-8 text-center text-gray-500 text-sm">
                    Δεν υπάρχουν ολοκληρωμένες αγωνιστικές ακόμα.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {matchdayStats.map((m, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 md:px-5 py-3.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium">Αγωνιστική #{m.matchdayNumber}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.correct}/{m.total} σωστές</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-20 bg-[#1a1a1a] rounded-full overflow-hidden hidden md:block">
                            <div className="h-1.5 bg-[#ff751f] rounded-full" style={{ width: Math.round((m.correct / m.total) * 100) + "%" }}></div>
                          </div>
                          <span className={`text-sm font-medium ${m.points >= 0 ? "text-[#ff751f]" : "text-red-400"}`}>
                            {m.points >= 0 ? "+" : ""}{m.points} πτς
                          </span>
                        </div>
                      </motion.div>
                    ))}
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