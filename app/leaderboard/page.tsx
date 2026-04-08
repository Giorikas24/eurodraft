"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getBadge } from "@/lib/badges";

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

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-10 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
              <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
            </div>
            <h1 className="text-3xl font-medium">Γενική Κατάταξη</h1>
          </div>
          {myRank && (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl px-6 py-4 text-center">
              <div className="text-3xl font-medium text-[#ff751f]">#{myRank}</div>
              <div className="text-xs text-gray-500 mt-1">Η θέση μου</div>
            </div>
          )}
        </div>

        {!loading && users.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[users[1], users[0], users[2]].map((u, i) => {
              const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const badge = getBadge(actualRank, users.length);
              return (
                <div key={u.id} className={`bg-[#111] border rounded-xl p-5 text-center ${actualRank === 1 ? "border-[#ff751f]" : "border-[#1e1e1e]"}`}>
                  <div className={`text-4xl font-medium mb-2 ${actualRank === 1 ? "text-[#ff751f]" : "text-white"}`}>
                    #{actualRank}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-lg font-medium mx-auto mb-3">
                    {u.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="text-sm font-medium mb-1">{u.username || u.email}</div>
                  <div className="text-xl font-medium text-[#ff751f]">{u.points} πτς</div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-medium mt-2 inline-block ${badge.class}`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_80px_80px] gap-4 px-6 py-3 border-b border-[#1a1a1a]">
            <div className="text-[10px] tracking-[2px] text-gray-600">#</div>
            <div className="text-[10px] tracking-[2px] text-gray-600">ΠΑΙΚΤΗΣ</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-center">BADGE</div>
            <div className="text-[10px] tracking-[2px] text-gray-600 text-right">ΠΟΝΤΟΙ</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Φόρτωση...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Δεν υπάρχουν παίκτες ακόμα.</div>
          ) : (
            users.map((u, index) => {
              const rank = index + 1;
              const badge = getBadge(rank, users.length);
              const isMe = user?.uid === u.id;
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[40px_1fr_80px_80px] gap-4 px-6 py-3.5 border-b border-[#1a1a1a] last:border-0 ${isMe ? "bg-[rgba(255,117,31,0.05)]" : ""}`}
                >
                  <div className={`text-sm font-medium ${rank <= 3 ? "text-[#ff751f]" : "text-gray-500"}`}>
                    {rank}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs font-medium text-white">
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {u.username || u.email}
                        {isMe && <span className="text-xs text-[#ff751f] ml-2">(εσύ)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="text-sm font-medium text-white text-right">{u.points}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}