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
      if ((leagueDoc.data() as League).members.includes(user.uid)) { alert("Είσαι ήδη μέλος!"); return; }
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
      <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
        <Navbar />

        {/* Header */}
        <div className="bg-black border-b-2 border-[#ff751f]">
          <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-0 mb-3">
                <div className="bg-[#ff751f] px-3 py-1">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
                </div>
                <div className="bg-white px-3 py-1">
                  <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Private Leagues</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                ΙΔΙΩ<span className="text-[#ff751f]">ΤΙΚΑ</span>
              </h1>
            </motion.div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8">

          {/* Create + Join */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-8 border-2 border-white/10 overflow-hidden">

            {/* Create */}
            <div className="bg-black border-b-2 md:border-b-0 md:border-r-2 border-white/10">
              <div className="bg-[#ff751f] px-4 py-2">
                <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Δημιούργησε</span>
              </div>
              <div className="p-5">
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>
                      Όνομα πρωταθλήματος
                    </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border-2 border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all font-black uppercase tracking-wide"
                      placeholder="π.χ. ΟΙ ΦΙΛΟΙ ΜΑΣ" required />
                  </div>
                  <button type="submit" disabled={creating}
                    className="bg-[#ff751f] text-black font-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f]">
                    {creating ? "Δημιουργία..." : "Δημιούργησε →"}
                  </button>
                </form>
              </div>
            </div>

            {/* Join */}
            <div className="bg-black">
              <div className="bg-white px-4 py-2">
                <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Εντάξου</span>
              </div>
              <div className="p-5">
                <form onSubmit={handleJoin} className="flex flex-col gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>
                      Κωδικός πρωταθλήματος
                    </label>
                    <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border-2 border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all font-black uppercase tracking-[6px]"
                      placeholder="ABC123" maxLength={6} required />
                  </div>
                  <button type="submit" disabled={joining}
                    className="border-2 border-[#ff751f] text-[#ff751f] font-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#ff751f] hover:text-black disabled:opacity-50 transition-all">
                    {joining ? "Αναζήτηση..." : "Εντάξου →"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* My leagues */}
          <div className="flex items-center gap-0 mb-4">
            <div className="bg-white px-4 py-2">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Τα πρωταθλήματά μου</span>
            </div>
            <div className="bg-white/10 px-4 py-2">
              <span className="text-white text-[9px] font-black tracking-[4px] uppercase">{leagues.length} leagues</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => <div key={i} className="h-24 bg-white/[0.02] border-2 border-white/10 animate-pulse"></div>)}
            </div>
          ) : leagues.length === 0 ? (
            <div className="border-2 border-white/10 bg-black p-10 text-center">
              <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                Δεν είσαι μέλος κανενός πρωταθλήματος ακόμα.
              </div>
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
                  className="border-2 border-white/10 bg-black block hover:border-[#ff751f]/50 transition-all overflow-hidden group"
                >
                  {/* Top stripe on hover */}
                  <div className="h-0.5 bg-[#ff751f] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

                  <div className="p-4 md:p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1 mr-4">
                        <div className="text-lg md:text-xl font-black uppercase truncate">{league.name}</div>
                        <div className="text-[10px] text-gray-600 mt-1 font-black uppercase tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
                          Δημιουργός: {league.ownerName}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 border-2 border-[#ff751f]/30 px-3 py-2">
                        <div className="text-[8px] text-gray-600 uppercase tracking-widest mb-1 font-black" style={{ fontFamily: "Arial, sans-serif" }}>Κωδικός</div>
                        <div className="font-black text-[#ff751f] text-lg tracking-[6px]">{league.code}</div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-2 font-black" style={{ fontFamily: "Arial, sans-serif" }}>
                        Μέλη ({league.members.length})
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {league.memberNames.map((memberName: string, i: number) => (
                          <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 font-black uppercase text-white">
                            {memberName}
                          </span>
                        ))}
                      </div>
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