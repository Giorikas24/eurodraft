"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface League {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  members: string[];
  memberNames: string[];
  createdAt: any;
}

export default function PrivatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchLeagues();
    else setLoading(false);
  }, [user]);

  const fetchLeagues = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "leagues"), where("members", "array-contains", user.uid));
      const snapshot = await getDocs(q);
      setLeagues(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as League)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth/login"); return; }
    setCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await addDoc(collection(db, "leagues"), {
        name, code,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        members: [user.uid],
        memberNames: [user.displayName || user.email],
        createdAt: new Date(),
      });
      setName("");
      fetchLeagues();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth/login"); return; }
    setJoining(true);
    try {
      const q = query(collection(db, "leagues"), where("code", "==", joinCode.toUpperCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { alert("Δεν βρέθηκε πρωτάθλημα με αυτόν τον κωδικό."); return; }
      const leagueDoc = snapshot.docs[0];
      const leagueData = leagueDoc.data() as League;
      if (leagueData.members.includes(user.uid)) { alert("Είσαι ήδη μέλος!"); return; }
      await updateDoc(doc(db, "leagues", leagueDoc.id), {
        members: arrayUnion(user.uid),
        memberNames: arrayUnion(user.displayName || user.email),
      });
      setJoinCode("");
      fetchLeagues();
    } catch (err) { console.error(err); }
    finally { setJoining(false); }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />

        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f] animate-pulse"></div>
              <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-medium mb-6 md:mb-8">Ιδιωτικά Πρωταθλήματα</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
              <h2 className="text-base md:text-lg font-medium mb-4">Δημιούργησε πρωτάθλημα</h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Όνομα πρωταθλήματος</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                    placeholder="" required />
                </div>
                <button type="submit" disabled={creating}
                  className="bg-[#ff751f] text-black font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-[#e6671a] disabled:opacity-50">
                  {creating ? "Δημιουργία..." : "Δημιούργησε"}
                </button>
              </form>
            </div>

            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
              <h2 className="text-base md:text-lg font-medium mb-4">Εντάξου σε πρωτάθλημα</h2>
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Κωδικός πρωταθλήματος</label>
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                    placeholder="π.χ. ABC123" maxLength={6} required />
                </div>
                <button type="submit" disabled={joining}
                  className="border border-[#ff751f] text-[#ff751f] font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-[rgba(255,117,31,0.1)] disabled:opacity-50">
                  {joining ? "Αναζήτηση..." : "Εντάξου"}
                </button>
              </form>
            </div>
          </motion.div>

          <h2 className="text-base md:text-lg font-medium mb-4">Τα πρωταθλήματά μου</h2>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl h-24 animate-pulse"></div>)}
            </div>
          ) : leagues.length === 0 ? (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-8 text-center text-gray-500 text-sm">
              Δεν είσαι μέλος κανενός ιδιωτικού πρωταθλήματος ακόμα.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leagues.map((league, i) => (
                <motion.a
                  key={league.id}
                  href={"/private/" + league.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 md:px-6 py-4 block hover:border-[#ff751f] transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="font-medium text-base md:text-lg truncate">{league.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Δημιουργός: {league.ownerName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 mb-1">Κωδικός</div>
                      <div className="font-mono font-medium text-[#ff751f] text-base md:text-lg tracking-widest">{league.code}</div>
                    </div>
                  </div>
                  <div className="border-t border-[#1a1a1a] pt-3">
                    <div className="text-xs text-gray-500 mb-2">Μέλη ({league.members.length})</div>
                    <div className="flex gap-2 flex-wrap">
                      {league.memberNames.map((memberName: string, i: number) => (
                        <span key={i} className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full text-white">
                          {memberName}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}