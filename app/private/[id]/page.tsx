"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";

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

const getBadge = (rank: number, total: number) => {
  const pct = rank / total;
  if (pct <= 0.1) return { label: "PLATINUM", class: "bg-[#1a1540] text-[#AFA9EC]" };
  if (pct <= 0.3) return { label: "GOLD", class: "bg-[#3a2e00] text-[#FAC775]" };
  if (pct <= 0.6) return { label: "SILVER", class: "bg-[#222] text-[#ccc]" };
  return { label: "BRONZE", class: "bg-[#2a1500] text-[#F0997B]" };
};

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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (memberIds: string[]) => {
    try {
      const memberStats: MemberStats[] = [];
      for (const uid of memberIds) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          memberStats.push({
            uid,
            username: data.username || data.email,
            points: data.points || 0,
          });
        }
      }
      memberStats.sort((a, b) => b.points - a.points);
      setMembers(memberStats);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const myRank = user ? members.findIndex(m => m.uid === user.uid) + 1 : null;

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Φόρτωση...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-10 py-12">
        <a href="/private" className="text-xs text-gray-500 hover:text-white mb-6 inline-block">← Πίσω</a>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
          <span className="text-[#ff751f] text-xs tracking-[3px]">ΙΔΙΩΤΙΚΟ ΠΡΩΤΑΘΛΗΜΑ</span>
        </div>

        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-medium">{league?.name}</h1>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Κωδικός</div>
            <div className="font-mono font-medium text-[#ff751f] text-xl tracking-widest">{league?.code}</div>
          </div>
        </div>

        {myRank && myRank > 0 && (
          <div className="bg-[rgba(255,117,31,0.08)] border border-[rgba(255,117,31,0.2)] rounded-xl px-6 py-4 mb-6 flex justify-between items-center">
            <span className="text-sm text-gray-400">Η θέση μου στο πρωτάθλημα</span>
            <span className="text-2xl font-medium text-[#ff751f]">#{myRank}</span>
          </div>
        )}

        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_80px_80px] gap-4 px-6 py-3 border-b border-[#1a1a1a]">
            <div className="text-[10px] tracking-[2px] text-gray-600">#</div>
            <div className="text-[10px] tracking-[2px] text-gray-600">ΠΑΙΚΤΗΣ</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-center">BADGE</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-right">ΠΟΝΤΟΙ</div>
          </div>

          {members.map((member, index) => {
            const rank = index + 1;
            const badge = getBadge(rank, members.length);
            const isMe = user?.uid === member.uid;
            return (
              <div key={member.uid} className={`grid grid-cols-[40px_1fr_80px_80px] gap-4 px-6 py-3.5 border-b border-[#1a1a1a] last:border-0 ${isMe ? "bg-[rgba(255,117,31,0.05)]" : ""}`}>
                <div className={`text-sm font-medium ${rank <= 3 ? "text-[#ff751f]" : "text-gray-500"}`}>{rank}</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs font-medium text-white">
                    {member.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {member.username}
                    {isMe && <span className="text-xs text-[#ff751f] ml-2">(εσύ)</span>}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="text-sm font-medium text-white text-right">{member.points}</div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}