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
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
                <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Ιδιωτικά Πρωταθλήματα</h1>
              <p className="text-gray-600 text-sm mt-2">Δημιούργησε ή εντάξου σε ένα πρωτάθλημα με φίλους.</p>
            </motion.div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8 md:py-10">

          {/* Create/Join */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">

            {/* Create */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-lg">➕</div>
                <h2 className="text-base font-black">Δημιούργησε πρωτάθλημα</h2>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block font-medium uppercase tracking-widest">Όνομα πρωταθλήματος</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#151515] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-colors placeholder-gray-700"
                    placeholder="π.χ. Παρέα Σπύρου" required />
                </div>
                <button type="submit" disabled={creating}
                  className="bg-[#ff751f] text-black font-black px-6 py-3 rounded-xl text-sm hover:bg-[#e6671a] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,117,31,0.2)] hover:shadow-[0_0_30px_rgba(255,117,31,0.4)]">
                  {creating ? "Δημιουργία..." : "Δημιούργησε"}
                </button>
              </form>
            </div>

            {/* Join */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-lg">🔗</div>
                <h2 className="text-base font-black">Εντάξου σε πρωτάθλημα</h2>
              </div>
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block font-medium uppercase tracking-widest">Κωδικός πρωταθλήματος</label>
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full bg-[#151515] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-colors placeholder-gray-700 font-mono tracking-widest uppercase"
                    placeholder="π.χ. ABC123" maxLength={6} required />
                </div>
                <button type="submit" disabled={joining}
                  className="border border-[#ff751f] text-[#ff751f] font-black px-6 py-3 rounded-xl text-sm hover:bg-[rgba(255,117,31,0.08)] disabled:opacity-50 transition-all">
                  {joining ? "Αναζήτηση..." : "Εντάξου"}
                </button>
              </form>
            </div>
          </motion.div>

          {/* My leagues */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-black">Τα πρωταθλήματά μου</h2>
              <span className="text-xs text-gray-600 bg-[#151515] border border-[#1a1a1a] px-2 py-0.5 rounded-full">{leagues.length}</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2].map(i => <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl h-28 animate-pulse"></div>)}
              </div>
            ) : leagues.length === 0 ? (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">🏆</div>
                <div className="text-gray-600 text-sm">Δεν είσαι μέλος κανενός ιδιωτικού πρωταθλήματος ακόμα.</div>
                <div className="text-gray-700 text-xs mt-1">Δημιούργησε ένα ή εντάξου με κωδικό.</div>
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
                    className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-5 md:px-6 py-5 block hover:border-[#ff751f]/40 hover:shadow-[0_0_30px_rgba(255,117,31,0.05)] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1 mr-4">
                        <div className="font-black text-lg truncate group-hover:text-[#ff751f] transition-colors">{league.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Δημιουργός: {league.ownerName}</div>
                      </div>
                      <div className="text-right flex-shrink-0 bg-[#151515] border border-[#1e1e1e] rounded-xl px-3 py-2">
                        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Κωδικός</div>
                        <div className="font-mono font-black text-[#ff751f] text-lg tracking-widest">{league.code}</div>
                      </div>
                    </div>
                    <div className="border-t border-[#151515] pt-3">
                      <div className="text-xs text-gray-600 mb-2 font-medium">Μέλη ({league.members.length})</div>
                      <div className="flex gap-2 flex-wrap">
                        {league.memberNames.map((memberName: string, i: number) => (
                          <span key={i} className="text-xs bg-[#151515] border border-[#1e1e1e] px-2.5 py-1 rounded-full text-gray-300 font-medium">
                            {memberName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </AuthGuard>
  );
}