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
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="bg-black border-b-2 border-[#ff751f]">
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-0 mb-3">
                <div className="bg-[#ff751f] px-3 py-1">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
                </div>
                <div className="bg-white px-3 py-1">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Season Rankings</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                ΚΑΤΑ<span className="text-[#ff751f]">ΤΑΞΗ</span>
              </h1>
            </motion.div>

            {myRank && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="border-2 border-[#ff751f] bg-black p-4 text-center">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Η θέση μου</div>
                <div className="text-5xl font-black text-[#ff751f] tabular-nums leading-none">#{myRank}</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8">

        {/* Podium */}
        {!loading && users.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-10">
            <div className="bg-[#ff751f] px-4 py-2 inline-block mb-6">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Top 3 Players</span>
            </div>
            <div className="flex items-end justify-center gap-1">
              {podiumOrder.map((u, i) => {
                const rank = podiumRanks[i];
                const badge = getBadge(rank, users.length);
                const isMe = user?.uid === u.id;
                const isFirst = rank === 1;
                return (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex flex-col items-center flex-1 max-w-[160px]"
                  >
                    {/* Avatar */}
                    <div className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-lg md:text-2xl font-black mb-2 border-2 ${
                      isFirst ? "bg-[#ff751f] text-black border-[#ff751f]" : "bg-white text-black border-white"
                    }`}>
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>

                    {/* Name */}
                    <div className="text-xs font-black text-white text-center uppercase truncate w-full px-1 mb-0.5">
                      {u.username || u.email}
                      {isMe && <span className="text-[#ff751f] ml-1">★</span>}
                    </div>

                    {/* Points */}
                    <div className={`text-sm font-black mb-1 ${isFirst ? "text-[#ff751f]" : "text-white"}`}>
                      {u.points} πτς
                    </div>

                    {/* Badge */}
                    <span className={`text-[8px] px-2 py-0.5 font-black mb-2 ${badge.class}`}>{badge.label}</span>

                    {/* Podium block */}
                    <div className={`w-full flex items-center justify-center border-2 ${
                      isFirst
                        ? "bg-[#ff751f] border-[#ff751f] h-24 md:h-32"
                        : rank === 2
                        ? "bg-white/10 border-white/30 h-16 md:h-20"
                        : "bg-white/5 border-white/20 h-12 md:h-16"
                    }`}>
                      <span className={`text-3xl md:text-4xl font-black ${isFirst ? "text-black" : "text-white"}`}>
                        {rank}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Full list */}
        <div>
          <div className="flex items-center gap-0 mb-4">
            <div className="bg-white px-4 py-2">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Full Standings</span>
            </div>
            <div className="bg-white/10 px-4 py-2">
              <span className="text-white text-[9px] font-black tracking-[4px] uppercase">{users.length} παίκτες</span>
            </div>
          </div>

          <div className="border-2 border-white/10 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_80px_70px] gap-2 px-4 py-3 bg-black border-b border-white/10">
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-600">#</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-600">Παίκτης</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-center">Badge</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-right">Πτς</div>
            </div>

            {loading ? (
              <div>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-14 border-b border-white/5 animate-pulse bg-white/[0.02]"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-600 text-xs uppercase font-black tracking-widest">
                Δεν υπάρχουν παίκτες ακόμα.
              </div>
            ) : (
              users.map((u, index) => {
                const rank = index + 1;
                const badge = getBadge(rank, users.length);
                const isMe = user?.uid === u.id;
                return (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`grid grid-cols-[40px_1fr_80px_70px] gap-2 px-4 py-3.5 border-b border-white/[0.06] last:border-0 transition-all ${
                      isMe ? "bg-[#ff751f]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className={`text-sm font-black self-center ${
                      isMe ? "text-black" : rank <= 3 ? "text-[#ff751f]" : "text-gray-600"
                    }`}>
                      {rank <= 3 ? ["01","02","03"][rank-1] : `${rank < 10 ? "0" : ""}${rank}`}
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        isMe ? "bg-black text-[#ff751f]" : "bg-white/10 text-white"
                      }`}>
                        {u.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className={`text-xs font-black uppercase truncate ${isMe ? "text-black" : "text-white"}`}>
                        {u.username || u.email}
                        {isMe && <span className="ml-1 text-[9px]">★ ΕΣΥ</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className={`text-[8px] px-2 py-0.5 font-black uppercase ${badge.class}`}>{badge.label}</span>
                    </div>
                    <div className={`text-sm font-black text-right self-center tabular-nums ${isMe ? "text-black" : "text-white"}`}>
                      {u.points}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}