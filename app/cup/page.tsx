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

export default function CupPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const total = users.length;
  const platinum = users.slice(0, Math.ceil(total * 0.25));
  const gold = users.slice(Math.ceil(total * 0.25), Math.ceil(total * 0.5));
  const silver = users.slice(Math.ceil(total * 0.5), Math.ceil(total * 0.75));
  const bronze = users.slice(Math.ceil(total * 0.75));

  const myRank = user ? users.findIndex(u => u.id === user.uid) + 1 : 0;
  const getMyCategory = () => {
    if (!user || myRank === 0) return null;
    if (platinum.find(p => p.id === user.uid)) return { label: "PLATINUM", class: "bg-[#1a1540] text-[#AFA9EC] border border-[#AFA9EC]/20" };
    if (gold.find(p => p.id === user.uid)) return { label: "GOLD", class: "bg-[#3a2e00] text-[#FAC775] border border-[#FAC775]/20" };
    if (silver.find(p => p.id === user.uid)) return { label: "SILVER", class: "bg-[#222] text-[#ccc] border border-[#ccc]/20" };
    return { label: "BRONZE", class: "bg-[#2a1500] text-[#F0997B] border border-[#F0997B]/20" };
  };
  const myCategory = getMyCategory();

  const categories = [
    { title: "PLATINUM", emoji: "💎", badgeClass: "bg-[#1a1540] text-[#AFA9EC] border border-[#AFA9EC]/20", color: "#AFA9EC", glow: "rgba(175,169,236,0.08)", players: platinum },
    { title: "GOLD", emoji: "🥇", badgeClass: "bg-[#3a2e00] text-[#FAC775] border border-[#FAC775]/20", color: "#FAC775", glow: "rgba(250,199,117,0.08)", players: gold },
    { title: "SILVER", emoji: "🥈", badgeClass: "bg-[#222] text-[#ccc] border border-[#ccc]/10", color: "#cccccc", glow: "rgba(200,200,200,0.05)", players: silver },
    { title: "BRONZE", emoji: "🥉", badgeClass: "bg-[#2a1500] text-[#F0997B] border border-[#F0997B]/20", color: "#F0997B", glow: "rgba(240,153,123,0.08)", players: bronze },
  ];

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
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
              <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Κύπελλο</h1>
            <p className="text-gray-600 text-sm max-w-lg">Οι παίκτες χωρίζονται σε 4 κατηγορίες. Μετά τις πρώτες 8 αγωνιστικές ξεκινά το knock-out τουρνουά.</p>
          </motion.div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8 md:py-10">

        {/* My category */}
        {myCategory && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-[#0f0f0f] border border-[rgba(255,117,31,0.15)] rounded-2xl px-5 py-4 mb-6 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">Η κατηγορία μου</div>
              <div className="text-sm text-white font-bold">{user?.displayName}</div>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-black ${myCategory.class}`}>{myCategory.label}</span>
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl h-24 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {categories.map((cat, ci) => (
              <motion.div key={cat.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * ci }}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#252525] transition-all"
                style={{ boxShadow: cat.players.length > 0 ? `0 0 40px ${cat.glow}` : "none" }}
              >
                <div className="px-5 py-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#111]">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-black ${cat.badgeClass}`}>{cat.title}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{cat.players.length} παίκτες</span>
                </div>
                <div className="divide-y divide-[#151515]">
                  {cat.players.length === 0 ? (
                    <div className="px-5 py-5 text-gray-600 text-sm text-center">Κανένας παίκτης ακόμα.</div>
                  ) : (
                    cat.players.map((p, i) => {
                      const isMe = user?.uid === p.id;
                      return (
                        <motion.div key={p.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className={`px-5 py-3 flex items-center gap-3 transition-all ${isMe ? "bg-[rgba(255,117,31,0.05)]" : "hover:bg-[#151515]"}`}
                        >
                          <span className="text-xs text-gray-600 w-5 font-bold">{i + 1}</span>
                          <div className={`w-8 h-8 rounded-full bg-[#1a1a1a] border flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${isMe ? "border-[#ff751f] shadow-[0_0_8px_rgba(255,117,31,0.3)]" : "border-[#2a2a2a]"}`}>
                            {p.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-sm text-white flex-1 truncate font-medium">
                            {p.username || p.email}
                            {isMe && <span className="text-xs text-[#ff751f] ml-2 font-black">(εσύ)</span>}
                          </span>
                          <span className="text-sm font-black flex-shrink-0" style={{ color: cat.color }}>{p.points} πτς</span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}