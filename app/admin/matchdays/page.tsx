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
    if (!confirm(`Σίγουρα θέλεις να διαγράψεις την Αγωνιστική #${m.number}; Αυτό θα διαγράψει και όλα τα ματς της.`)) return;
    setDeleting(m.id);
    try {
      // Delete all games first
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

  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">Φόρτωση...</div>;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center px-10 gap-4">
        <a href="/" className="font-bold text-2xl tracking-widest">
          <span className="text-[#ff751f]">EURO</span>
          <span className="text-white">DRAFT</span>
        </a>
        <span className="text-xs text-gray-500 border border-[#333] px-2 py-1 rounded">ADMIN</span>
        <a href="/admin" className="text-xs text-gray-500 hover:text-white ml-4">← Πίσω</a>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black">Αγωνιστικές</h1>
            <p className="text-xs text-gray-600 mt-1">{matchdays.length} αγωνιστικές συνολικά</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-black px-5 py-2.5 rounded-xl text-sm hover:bg-[#e6671a] transition-all shadow-[0_0_20px_rgba(255,117,31,0.2)]">
            + Νέα αγωνιστική
          </button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f0f] border border-[#ff751f]/30 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-black mb-1">Αγωνιστική #{nextNumber}</h2>
            <p className="text-xs text-gray-500 mb-4">Επέλεξε το deadline — συνήθως λίγο πριν το πρώτο ματς.</p>
            <form onSubmit={handleCreate} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-600 mb-1.5 block uppercase tracking-widest">Deadline</label>
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#151515] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  required />
              </div>
              <button type="submit" disabled={saving}
                className="bg-[#ff751f] text-black font-black px-6 py-2.5 rounded-xl text-sm hover:bg-[#e6671a] disabled:opacity-50">
                {saving ? "..." : "Δημιούργησε"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-[#333] text-gray-400 px-4 py-2.5 rounded-xl text-sm hover:bg-[#1a1a1a]">
                Ακύρωση
              </button>
            </form>
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          {matchdays.length === 0 && (
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-8 text-center text-gray-600 text-sm">
              Δεν υπάρχουν αγωνιστικές ακόμα.
            </div>
          )}
          {matchdays.map((m) => (
            <motion.div key={m.id} layout
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-5 py-4 flex justify-between items-center hover:border-[#2a2a2a] transition-all">
              <a href={"/admin/matchdays/" + m.id} className="flex-1">
                <div className="font-black">Αγωνιστική #{m.number}</div>
                <div className="text-xs text-gray-600 mt-1">Deadline: {formatDate(m.deadline)}</div>
              </a>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${m.status === "open" ? "bg-green-900/50 text-green-400" : "bg-[#222] text-gray-500"}`}>
                  {m.status === "open" ? "Ανοιχτή" : "Κλειστή"}
                </span>
                <a href={"/admin/matchdays/" + m.id}
                  className="text-xs text-[#ff751f] border border-[rgba(255,117,31,0.2)] px-2.5 py-1 rounded-lg hover:bg-[rgba(255,117,31,0.1)] transition-all">
                  Διαχείριση →
                </a>
                <button onClick={() => handleDelete(m)} disabled={deleting === m.id}
                  className="text-xs border border-[#333] text-gray-600 px-2.5 py-1 rounded-lg hover:border-red-500 hover:text-red-400 transition-all disabled:opacity-50">
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