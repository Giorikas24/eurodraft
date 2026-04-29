"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
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
    if (platinum.find(p => p.id === user.uid)) return { label: "PLATINUM", color: "#AFA9EC" };
    if (gold.find(p => p.id === user.uid)) return { label: "GOLD", color: "#FAC775" };
    if (silver.find(p => p.id === user.uid)) return { label: "SILVER", color: "#cccccc" };
    return { label: "BRONZE", color: "#F0997B" };
  };
  const myCategory = getMyCategory();

  const categories = [
    { title: "PLATINUM", color: "#AFA9EC", bg: "#1a1540", players: platinum },
    { title: "GOLD", color: "#FAC775", bg: "#3a2e00", players: gold },
    { title: "SILVER", color: "#cccccc", bg: "#222222", players: silver },
    { title: "BRONZE", color: "#F0997B", bg: "#2a1500", players: bronze },
  ];

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
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Cup System</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                ΚΥ<span className="text-[#ff751f]">ΠΕΛ</span>ΛΟ
              </h1>
              <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-2 font-black" style={{ fontFamily: "Arial, sans-serif" }}>
                4 κατηγορίες · Knock-out τουρνουά
              </p>
            </motion.div>

            {myCategory && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="border-2 p-4 text-center" style={{ borderColor: myCategory.color + "60" }}>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-2" style={{ fontFamily: "Arial, sans-serif" }}>Η κατηγορία μου</div>
                <div className="text-2xl font-black" style={{ color: myCategory.color }}>{myCategory.label}</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8">

        {/* How it works */}
        <div className="border-2 border-white/10 bg-black mb-6 overflow-hidden">
          <div className="bg-white px-4 py-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Πώς λειτουργεί</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-0 divide-x divide-white/10">
            {[
              { num: "8", label: "Αγωνιστικές για κατάταξη" },
              { num: "4", label: "Κατηγορίες παικτών" },
              { num: "K/O", label: "Knock-out φάση" },
            ].map((s, i) => (
              <div key={i} className="px-4 text-center">
                <div className="text-3xl font-black text-[#ff751f] tabular-nums">{s.num}</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-wide mt-1 font-black" style={{ fontFamily: "Arial, sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-white/[0.02] border-2 border-white/10 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex flex-col gap-3">
            {categories.map((cat, ci) => {
              const isMyCategory = myCategory?.label === cat.title;
              return (
                <motion.div key={cat.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.08 }}
                  className={`border-2 overflow-hidden ${isMyCategory ? "border-opacity-60" : "border-white/10"}`}
                  style={{ borderColor: isMyCategory ? cat.color + "60" : undefined }}
                >
                  {/* Category header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10"
                    style={{ backgroundColor: cat.bg }}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black" style={{ color: cat.color }}>{cat.title}</span>
                      {isMyCategory && (
                        <span className="text-[9px] bg-black/30 px-2 py-0.5 font-black uppercase tracking-widest" style={{ color: cat.color }}>
                          ★ ΕΣΥ
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: cat.color + "80", fontFamily: "Arial, sans-serif" }}>
                      {cat.players.length} παίκτες
                    </span>
                  </div>

                  {/* Players */}
                  <div className="bg-black">
                    {cat.players.length === 0 ? (
                      <div className="px-4 py-4 text-gray-600 text-[10px] uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                        Κανένας παίκτης ακόμα.
                      </div>
                    ) : (
                      cat.players.map((p, i) => {
                        const isMe = user?.uid === p.id;
                        return (
                          <div key={p.id}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] last:border-0 transition-all ${
                              isMe ? "bg-[#ff751f]" : "hover:bg-white/[0.02]"
                            }`}>
                            <span className={`text-[10px] font-black w-6 tabular-nums ${isMe ? "text-black" : "text-gray-600"}`}>
                              {i + 1 < 10 ? `0${i + 1}` : i + 1}
                            </span>
                            <div className={`w-7 h-7 flex items-center justify-center text-xs font-black flex-shrink-0 ${isMe ? "bg-black text-[#ff751f]" : "bg-white/10 text-white"}`}>
                              {p.username?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className={`text-xs font-black uppercase flex-1 truncate ${isMe ? "text-black" : "text-white"}`}>
                              {p.username || p.email}
                              {isMe && <span className="ml-1 text-[9px]">★</span>}
                            </span>
                            <span className={`text-xs font-black tabular-nums flex-shrink-0 ${isMe ? "text-black" : ""}`}
                              style={{ color: isMe ? undefined : cat.color }}>
                              {p.points} πτς
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}