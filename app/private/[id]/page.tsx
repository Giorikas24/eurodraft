"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { getBadge } from "@/lib/badges";
import { motion } from "framer-motion";

interface League {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  members: string[];
  memberNames: string[];
}

interface MemberStats {
  uid: string;
  username: string;
  points: number;
}

export default function PrivateLeaguePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leagueId = params.id as string;
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/auth/login"); return; }
    fetchLeague();
  }, [user, loading]);

  const fetchLeague = async () => {
    try {
      const leagueDoc = await getDoc(doc(db, "leagues", leagueId));
      if (!leagueDoc.exists()) { router.push("/private"); return; }
      const leagueData = { id: leagueDoc.id, ...leagueDoc.data() } as League;
      setLeague(leagueData);
      fetchMembers(leagueData.members);
    } catch (err) { console.error(err); }
  };

  const fetchMembers = async (memberIds: string[]) => {
    try {
      const memberStats: MemberStats[] = [];
      for (const uid of memberIds) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          memberStats.push({ uid, username: data.username || data.email, points: data.points || 0 });
        }
      }
      memberStats.sort((a, b) => b.points - a.points);
      setMembers(memberStats);
    } catch (err) { console.error(err); }
    finally { setPageLoading(false); }
  };

  const myRank = user ? members.findIndex(m => m.uid === user.uid) + 1 : null;

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-6 h-6 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="bg-black border-b-2 border-[#ff751f]">
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">
          <a href="/private" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-[#ff751f] transition-colors mb-4">
            ← Πίσω
          </a>
          <div className="flex items-center gap-0 mb-3">
            <div className="bg-[#ff751f] px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Ιδιωτικό</span>
            </div>
            <div className="bg-white px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Πρωτάθλημα</span>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between gap-4">
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-none tracking-tighter truncate flex-1">
              {league?.name}
            </h1>
            <div className="flex-shrink-0 border-2 border-[#ff751f]/40 px-4 py-3 text-right">
              <div className="text-[8px] text-gray-600 uppercase tracking-widest font-black mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Κωδικός</div>
              <div className="font-black text-[#ff751f] text-xl tracking-[6px]">{league?.code}</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">

        {/* My rank */}
        {myRank && myRank > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="border-2 border-[#ff751f]/30 bg-[#ff751f]/5 px-5 py-4 mb-6 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Η θέση μου</span>
            <span className="text-4xl font-black text-[#ff751f] tabular-nums">#{myRank}</span>
          </motion.div>
        )}

        {/* Standings */}
        <div className="flex items-center gap-0 mb-4">
          <div className="bg-[#ff751f] px-4 py-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Κατάταξη</span>
          </div>
          <div className="bg-white/10 px-4 py-2">
            <span className="text-white text-[9px] font-black tracking-[4px] uppercase">{members.length} παίκτες</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="border-2 border-white/10 overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_80px_70px] gap-2 px-4 py-3 bg-black border-b border-white/10">
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600">#</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600">Παίκτης</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-center">Badge</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-right">Πτς</div>
          </div>

          {members.map((member, index) => {
            const rank = index + 1;
            const badge = getBadge(rank, members.length);
            const isMe = user?.uid === member.uid;
            return (
              <motion.div key={member.uid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`grid grid-cols-[40px_1fr_80px_70px] gap-2 px-4 py-3.5 border-b border-white/[0.06] last:border-0 transition-all ${
                  isMe ? "bg-[#ff751f]" : "bg-black hover:bg-white/[0.02]"
                }`}
              >
                <div className={`text-xs font-black self-center tabular-nums ${
                  isMe ? "text-black" : rank <= 3 ? "text-[#ff751f]" : "text-gray-600"
                }`}>
                  {rank <= 3 ? ["01","02","03"][rank-1] : `${rank < 10 ? "0" : ""}${rank}`}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    isMe ? "bg-black text-[#ff751f]" : "bg-white/10 text-white"
                  }`}>
                    {member.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className={`text-xs font-black uppercase truncate ${isMe ? "text-black" : "text-white"}`}>
                    {member.username}
                    {isMe && <span className="ml-1 text-[9px]">★ ΕΣΥ</span>}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-[8px] px-2 py-0.5 font-black uppercase ${badge.class}`}>{badge.label}</span>
                </div>
                <div className={`text-sm font-black text-right self-center tabular-nums ${isMe ? "text-black" : "text-white"}`}>
                  {member.points}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}