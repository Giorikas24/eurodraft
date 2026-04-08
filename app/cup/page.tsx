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

export default function CupPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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

  const total = users.length;
  const platinum = users.slice(0, Math.ceil(total * 0.25));
  const gold = users.slice(Math.ceil(total * 0.25), Math.ceil(total * 0.5));
  const silver = users.slice(Math.ceil(total * 0.5), Math.ceil(total * 0.75));
  const bronze = users.slice(Math.ceil(total * 0.75));

  const myRank = user ? users.findIndex(u => u.id === user.uid) + 1 : 0;
  const myCategory = myRank > 0 ? getBadge(myRank, total) : null;

  const CategorySection = ({ title, badgeClass, players, color }: { title: string, badgeClass: string, players: UserData[], color: string }) => (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1a1a1a] flex justify-between items-center">
        <span className={`text-xs px-3 py-1 rounded font-medium ${badgeClass}`}>{title}</span>
        <span className="text-xs text-gray-500">{players.length} παίκτες</span>
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {players.length === 0 ? (
          <div className="px-6 py-4 text-gray-500 text-sm">Κανένας παίκτης ακόμα.</div>
        ) : (
          players.map((p, i) => {
            const isMe = user?.uid === p.id;
            return (
              <div key={p.id} className={`px-6 py-3 flex items-center gap-3 ${isMe ? "bg-[rgba(255,117,31,0.05)]" : ""}`}>
                <span className="text-xs text-gray-600 w-6">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                  {p.username?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm text-white flex-1">
                  {p.username || p.email}
                  {isMe && <span className="text-xs text-[#ff751f] ml-2">(εσύ)</span>}
                </span>
                <span className="text-sm font-medium" style={{ color }}>{p.points} πτς</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-10 py-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
          <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
        </div>
        <h1 className="text-3xl font-medium mb-2">Κύπελλο</h1>
        <p className="text-gray-500 text-sm mb-8">Οι παίκτες χωρίζονται σε 4 κατηγορίες. Μετά τις πρώτες 8 αγωνιστικές ξεκινά το knock-out τουρνουά.</p>

        {myCategory && (
          <div className="bg-[rgba(255,117,31,0.08)] border border-[rgba(255,117,31,0.2)] rounded-xl px-6 py-4 mb-8 flex justify-between items-center">
            <span className="text-sm text-gray-400">Η κατηγορία μου</span>
            <span className={`text-xs px-3 py-1 rounded font-medium ${myCategory.class}`}>{myCategory.label}</span>
          </div>
        )}

        {loading ? (
          <div className="text-gray-500 text-sm">Φόρτωση...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <CategorySection title="PLATINUM" badgeClass="bg-[#1a1540] text-[#AFA9EC]" players={platinum} color="#AFA9EC" />
            <CategorySection title="GOLD" badgeClass="bg-[#3a2e00] text-[#FAC775]" players={gold} color="#FAC775" />
            <CategorySection title="SILVER" badgeClass="bg-[#222] text-[#ccc]" players={silver} color="#cccccc" />
            <CategorySection title="BRONZE" badgeClass="bg-[#2a1500] text-[#F0997B]" players={bronze} color="#F0997B" />
          </div>
        )}
      </div>
    </main>
  );
}