"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getBadge } from "@/lib/badges";
import { motion } from "framer-motion";

interface UserData {
  id: string;
  username: string;
  email: string;
  points: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeaderboard(); }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const myRank = user ? users.findIndex(u => u.id === user.uid) + 1 : null;
  const podiumOrder = users.length >= 3 ? [users[1], users[0], users[2]] : [];
  const podiumRanks = [2, 1, 3];

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ff751f] opacity-[0.05] blur-[100px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "linear-gradient(#ff751f 1px, transparent 1px), linear-gradient(90deg, #ff751f 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}></div>
        </div>
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-10 relative">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
                <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Γενική Κατάταξη</h1>
              <p className="text-gray-600 text-sm mt-1">{users.length} παίκτες συνολικά</p>
            </motion.div>

            {myRank && myRank > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#0f0f0f] border border-[rgba(255,117,31,0.2)] rounded-2xl px-6 py-4 text-center shadow-[0_0_30px_rgba(255,117,31,0.08)]">
                <div className="text-3xl md:text-4xl font-black text-[#ff751f] drop-shadow-[0_0_10px_rgba(255,117,31,0.5)]">#{myRank}</div>
                <div className="text-xs text-gray-500 mt-1 tracking-widest uppercase">Η θέση μου</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8 md:py-10">

        {/* Podium */}
        {!loading && users.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10">
            <div className="flex items-end justify-center gap-3 md:gap-4">
              {podiumOrder.map((u, i) => {
                const rank = podiumRanks[i];
                const badge = getBadge(rank, users.length);
                const isMe = user?.uid === u.id;
                const heights = ["h-24 md:h-28", "h-32 md:h-36", "h-20 md:h-24"];
                const colors = [
                  "from-[#3a3a3a] to-[#2a2a2a]",
                  "from-[#ff751f] to-[#cc5500]",
                  "from-[#2a2a2a] to-[#1a1a1a]"
                ];
                return (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 * i }}
                    className="flex flex-col items-center flex-1 max-w-[140px] md:max-w-[200px]"
                  >
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#1a1a1a] border-2 flex items-center justify-center text-lg md:text-2xl font-black mb-2 ${
                      rank === 1
                        ? "border-[#ff751f] shadow-[0_0_25px_rgba(255,117,31,0.4)]"
                        : rank === 2 ? "border-[#888]" : "border-[#555]"
                    }`}>
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="text-xs md:text-sm font-bold text-center mb-0.5 px-1 truncate w-full">
                      {u.username || u.email}
                      {isMe && <span className="text-[10px] text-[#ff751f] ml-1">(εσύ)</span>}
                    </div>
                    <div className={`text-sm md:text-base font-black mb-1 ${rank === 1 ? "text-[#ff751f]" : "text-gray-300"}`}>
                      {u.points} πτς
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold mb-2 ${badge.class}`}>{badge.label}</span>
                    <div className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center bg-gradient-to-b ${colors[i]} border-t ${rank === 1 ? "border-[#ff751f]/30" : "border-[#333]"}`}>
                      <span className={`text-2xl md:text-3xl font-black ${rank === 1 ? "text-black" : "text-white"}`}>
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Full list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_70px_60px] md:grid-cols-[40px_1fr_80px_80px] gap-2 md:gap-4 px-4 md:px-6 py-3.5 border-b border-[#1a1a1a] bg-[#111]">
            <div className="text-[10px] tracking-[3px] text-gray-600 font-bold">#</div>
            <div className="text-[10px] tracking-[3px] text-gray-600 font-bold">ΠΑΙΚΤΗΣ</div>
            <div className="text-[10px] tracking-[3px] text-gray-600 font-bold text-center">BADGE</div>
            <div className="text-[10px] tracking-[3px] text-gray-600 font-bold text-right">ΠΤΣ</div>
          </div>

          {loading ? (
            <div className="flex flex-col">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 border-b border-[#1a1a1a] animate-pulse bg-[#1a1a1a]/20"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🏀</div>
              <div className="text-gray-500 text-sm">Δεν υπάρχουν παίκτες ακόμα.</div>
            </div>
          ) : (
            users.map((u, index) => {
              const rank = index + 1;
              const badge = getBadge(rank, users.length);
              const isMe = user?.uid === u.id;
              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className={`grid grid-cols-[32px_1fr_70px_60px] md:grid-cols-[40px_1fr_80px_80px] gap-2 md:gap-4 px-4 md:px-6 py-3.5 border-b border-[#1a1a1a] last:border-0 transition-all ${
                    isMe
                      ? "bg-[rgba(255,117,31,0.06)] border-l-2 border-l-[#ff751f]"
                      : "hover:bg-[#151515]"
                  }`}
                >
                  <div className={`text-sm font-black self-center ${rank <= 3 ? "text-[#ff751f]" : "text-gray-600"}`}>
                    {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-[#1a1a1a] border-2 flex-shrink-0 flex items-center justify-center text-xs font-black text-white ${
                      isMe ? "border-[#ff751f] shadow-[0_0_8px_rgba(255,117,31,0.3)]" : "border-[#2a2a2a]"
                    }`}>
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {u.username || u.email}
                        {isMe && <span className="text-xs text-[#ff751f] ml-2 hidden md:inline font-black">(εσύ)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="text-sm font-black text-white text-right self-center">{u.points}</div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </main>
  );
}