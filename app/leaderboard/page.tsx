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

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const myRank = user ? users.findIndex(u => u.id === user.uid) + 1 : null;
  const podiumOrder = users.length >= 3 ? [users[1], users[0], users[2]] : [];
  const podiumRanks = [2, 1, 3];
  const podiumHeights = ["h-20 md:h-24", "h-28 md:h-32", "h-16 md:h-20"];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f] animate-pulse"></div>
              <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-medium">Γενική Κατάταξη</h1>
          </motion.div>

          {myRank && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 md:px-6 py-3 md:py-4 text-center">
              <div className="text-2xl md:text-3xl font-medium text-[#ff751f]">#{myRank}</div>
              <div className="text-xs text-gray-500 mt-1">Η θέση μου</div>
            </motion.div>
          )}
        </div>

        {/* Podium */}
        {!loading && users.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 md:mb-10">
            <div className="flex items-end justify-center gap-2 md:gap-3">
              {podiumOrder.map((u, i) => {
                const rank = podiumRanks[i];
                const badge = getBadge(rank, users.length);
                const isMe = user?.uid === u.id;
                return (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="flex flex-col items-center flex-1 max-w-[120px] md:max-w-[180px]"
                  >
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#1a1a1a] border-2 flex items-center justify-center text-base md:text-xl font-medium mb-1.5 ${rank === 1 ? "border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.3)]" : "border-[#2a2a2a]"}`}>
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-center mb-0.5 px-1 truncate w-full text-center">
                      {u.username || u.email}
                      {isMe && <span className="text-[10px] text-[#ff751f] ml-1">(εσύ)</span>}
                    </div>
                    <div className={`text-sm md:text-lg font-medium ${rank === 1 ? "text-[#ff751f]" : "text-white"}`}>{u.points} πτς</div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium mb-1.5 ${badge.class}`}>{badge.label}</span>
                    <div className={`w-full ${podiumHeights[i]} rounded-t-lg flex items-center justify-center ${rank === 1 ? "bg-[#ff751f]" : rank === 2 ? "bg-[#333]" : "bg-[#222]"}`}>
                      <span className={`text-xl md:text-2xl font-bold ${rank === 1 ? "text-black" : "text-white"}`}>#{rank}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Full list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_70px_60px] md:grid-cols-[40px_1fr_80px_80px] gap-2 md:gap-4 px-4 md:px-6 py-3 border-b border-[#1a1a1a]">
            <div className="text-[10px] tracking-[2px] text-gray-600">#</div>
            <div className="text-[10px] tracking-[2px] text-gray-600">ΠΑΙΚΤΗΣ</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-center">BADGE</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-right">ΠΤΣ</div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-0">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 border-b border-[#1a1a1a] animate-pulse bg-[#1a1a1a]/30"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Δεν υπάρχουν παίκτες ακόμα.</div>
          ) : (
            users.map((u, index) => {
              const rank = index + 1;
              const badge = getBadge(rank, users.length);
              const isMe = user?.uid === u.id;
              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`grid grid-cols-[32px_1fr_70px_60px] md:grid-cols-[40px_1fr_80px_80px] gap-2 md:gap-4 px-4 md:px-6 py-3 border-b border-[#1a1a1a] last:border-0 transition-colors ${isMe ? "bg-[rgba(255,117,31,0.05)]" : "hover:bg-[#1a1a1a]/50"}`}
                >
                  <div className={`text-sm font-medium self-center ${rank <= 3 ? "text-[#ff751f]" : "text-gray-500"}`}>
                    {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1a1a1a] border flex-shrink-0 flex items-center justify-center text-xs font-medium text-white ${isMe ? "border-[#ff751f]" : "border-[#2a2a2a]"}`}>
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="text-sm font-medium text-white truncate">
                      {u.username || u.email}
                      {isMe && <span className="text-xs text-[#ff751f] ml-1 hidden md:inline">(εσύ)</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="text-sm font-medium text-white text-right self-center">{u.points}</div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </main>
  );
}