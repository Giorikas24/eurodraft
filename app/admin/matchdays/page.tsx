"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, orderBy, query, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

interface Matchday {
  id: string;
  number: number;
  name?: string;
  deadline: any;
  status: string;
}

export default function MatchdaysPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchMatchdays();
  }, [user]);

  const fetchMatchdays = async () => {
    const q = query(collection(db, "matchdays"), orderBy("number", "desc"));
    const snapshot = await getDocs(q);
    setMatchdays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matchday)));
  };

  const nextNumber = matchdays.length > 0 ? Math.max(...matchdays.map(m => m.number)) + 1 : 1;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "matchdays"), {
        number: nextNumber,
        deadline: new Date(deadline),
        status: "open",
        createdAt: new Date(),
      });
      setDeadline("");
      setShowForm(false);
      fetchMatchdays();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m: Matchday) => {
    if (!confirm(`Σίγουρα θέλεις να διαγράψεις την Αγωνιστική #${m.number};`)) return;
    setDeleting(m.id);
    try {
      const gamesSnap = await getDocs(collection(db, "matchdays", m.id, "games"));
      for (const gameDoc of gamesSnap.docs) {
        await deleteDoc(doc(db, "matchdays", m.id, "games", gameDoc.id));
      }
      await deleteDoc(doc(db, "matchdays", m.id));
      fetchMatchdays();
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const formatDate = (deadline: any) => {
    if (!deadline) return "";
    const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return d.toLocaleString("el-GR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <nav className="bg-black border-b-2 border-[#ff751f] h-14 flex items-center px-10 gap-0">
        <a href="/" className="flex items-center gap-0 mr-4">
          <div className="bg-[#ff751f] px-2.5 py-1.5">
            <span className="text-black font-black text-sm tracking-tighter">COURT</span>
          </div>
          <div className="bg-white px-2.5 py-1.5">
            <span className="text-black font-black text-sm tracking-tighter">PROPHET</span>
          </div>
        </a>
        <div className="bg-white/10 px-3 py-1.5 border border-white/20 mr-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin</span>
        </div>
        <a href="/admin" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-[#ff751f] transition-colors">
          ← Πίσω
        </a>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-10">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-0 mb-3">
              <div className="bg-[#ff751f] px-3 py-1">
                <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Admin</span>
              </div>
              <div className="bg-white px-3 py-1">
                <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Matchdays</span>
              </div>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tighter">
              ΑΓΩΝΙ<span className="text-[#ff751f]">ΣΤΙΚΕΣ</span>
            </h1>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-2" style={{ fontFamily: "Arial, sans-serif" }}>
              {matchdays.length} αγωνιστικές συνολικά
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-black px-5 py-3 text-xs uppercase tracking-widest hover:bg-white transition-all border-2 border-[#ff751f]">
            + Νέα
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#ff751f]/50 bg-black mb-6 overflow-hidden">
            <div className="bg-[#ff751f] px-4 py-2">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Νέα Αγωνιστική #{nextNumber}</span>
            </div>
            <div className="p-5">
              <form onSubmit={handleCreate} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Deadline</label>
                  <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-white/5 border-2 border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all"
                    required />
                </div>
                <button type="submit" disabled={saving}
                  className="bg-[#ff751f] text-black font-black px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f]">
                  {saving ? "..." : "Δημιούργησε"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border-2 border-white/20 text-gray-400 px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:border-white hover:text-white transition-all">
                  ✕
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* List */}
        <div className="flex flex-col gap-2">
          {matchdays.length === 0 && (
            <div className="border-2 border-white/10 bg-black p-10 text-center">
              <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                Δεν υπάρχουν αγωνιστικές ακόμα.
              </div>
            </div>
          )}
          {matchdays.map((m) => (
            <motion.div key={m.id} layout
              className="border-2 border-white/10 bg-black flex items-center overflow-hidden hover:border-white/20 transition-all group">
              <a href={"/admin/matchdays/" + m.id} className="flex-1 p-4">
                <div className="text-sm font-black uppercase">{m.name || `Αγωνιστική #${m.number}`}</div>
                <div className="text-[10px] text-gray-600 mt-1 font-black uppercase tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
                  Deadline: {formatDate(m.deadline)}
                </div>
              </a>
              <div className="flex items-stretch h-full divide-x divide-white/10">
                <div className={`px-3 py-4 flex items-center ${m.status === "open" ? "bg-green-500/10" : "bg-white/5"}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${m.status === "open" ? "text-green-400" : "text-gray-600"}`}>
                    {m.status === "open" ? "● Ανοιχτή" : "Κλειστή"}
                  </span>
                </div>
                <a href={"/admin/matchdays/" + m.id}
                  className="px-4 py-4 flex items-center text-[10px] font-black uppercase tracking-widest text-[#ff751f] hover:bg-[#ff751f] hover:text-black transition-all">
                  Διαχείριση →
                </a>
                <button onClick={() => handleDelete(m)} disabled={deleting === m.id}
                  className="px-4 py-4 text-[10px] font-black text-gray-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                  {deleting === m.id ? "..." : "✕"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}