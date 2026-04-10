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
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-6 h-6 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12">
        <a href="/private" className="text-xs text-gray-500 hover:text-white mb-6 inline-block">← Πίσω</a>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
          <span className="text-[#ff751f] text-xs tracking-[3px]">ΙΔΙΩΤΙΚΟ ΠΡΩΤΑΘΛΗΜΑ</span>
        </div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-medium truncate mr-4">{league?.name}</h1>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-500 mb-1">Κωδικός</div>
            <div className="font-mono font-medium text-[#ff751f] text-base md:text-xl tracking-widest">{league?.code}</div>
          </div>
        </motion.div>

        {myRank && myRank > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-[rgba(255,117,31,0.08)] border border-[rgba(255,117,31,0.2)] rounded-xl px-4 md:px-6 py-4 mb-5 flex justify-between items-center">
            <span className="text-sm text-gray-400">Η θέση μου στο πρωτάθλημα</span>
            <span className="text-xl md:text-2xl font-medium text-[#ff751f]">#{myRank}</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_70px_60px] md:grid-cols-[40px_1fr_80px_80px] gap-2 md:gap-4 px-4 md:px-6 py-3 border-b border-[#1a1a1a]">
            <div className="text-[10px] tracking-[2px] text-gray-600">#</div>
            <div className="text-[10px] tracking-[2px] text-gray-600">ΠΑΙΚΤΗΣ</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-center">BADGE</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-right">ΠΤΣ</div>
          </div>

          {members.map((member, index) => {
            const rank = index + 1;
            const badge = getBadge(rank, members.length);
            const isMe = user?.uid === member.uid;
            return (
              <motion.div key={member.uid}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-[32px_1fr_70px_60px] md:grid-cols-[40px_1fr_80px_80px] gap-2 md:gap-4 px-4 md:px-6 py-3 border-b border-[#1a1a1a] last:border-0 ${isMe ? "bg-[rgba(255,117,31,0.05)]" : ""}`}
              >
                <div className={`text-sm font-medium self-center ${rank <= 3 ? "text-[#ff751f]" : "text-gray-500"}`}>
                  {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
                </div>
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1a1a1a] border flex-shrink-0 flex items-center justify-center text-xs font-medium text-white ${isMe ? "border-[#ff751f]" : "border-[#2a2a2a]"}`}>
                    {member.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-medium text-white truncate">
                    {member.username}
                    {isMe && <span className="text-xs text-[#ff751f] ml-1 hidden md:inline">(εσύ)</span>}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="text-sm font-medium text-white text-right self-center">{member.points}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}