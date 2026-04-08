"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchMatchdays();
    }
  }, [user]);

  const fetchMatchdays = async () => {
    const q = query(collection(db, "matchdays"), orderBy("number", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Matchday));
    setMatchdays(data);
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
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (deadline: any) => {
    if (!deadline) return "";
    const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return d.toLocaleString("el-GR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Φόρτωση...</div>;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
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
          <h1 className="text-2xl font-medium">Αγωνιστικές</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-[#e6671a]"
          >
            + Νέα αγωνιστική
          </button>
        </div>

        {showForm && (
          <div className="bg-[#111] border border-[#ff751f] rounded-xl p-6 mb-6">
            <h2 className="text-base font-medium mb-1">Αγωνιστική #{nextNumber}</h2>
            <p className="text-xs text-gray-500 mb-4">Επέλεξε το deadline — συνήθως λίγο πριν το πρώτο ματς.</p>
            <form onSubmit={handleCreate} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1.5 block">Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#ff751f] text-black font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-[#e6671a] disabled:opacity-50"
              >
                {saving ? "..." : "Δημιούργησε"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-[#333] text-gray-400 px-4 py-2.5 rounded-lg text-sm hover:bg-[#1a1a1a]"
              >
                Ακύρωση
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {matchdays.length === 0 && (
            <div className="text-gray-500 text-sm text-center py-8">Δεν υπάρχουν αγωνιστικές ακόμα.</div>
          )}
          {matchdays.map((m) => (
            <a
              key={m.id}
              href={"/admin/matchdays/" + m.id}
              className="bg-[#111] border border-[#1e1e1e] rounded-xl px-6 py-4 flex justify-between items-center hover:border-[#ff751f] transition-colors"
            >
              <div>
                <div className="font-medium">Αγωνιστική #{m.number}</div>
                <div className="text-xs text-gray-500 mt-1">Deadline: {formatDate(m.deadline)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded font-medium ${m.status === "open" ? "bg-green-900 text-green-400" : "bg-[#222] text-gray-500"}`}>
                  {m.status === "open" ? "Ανοιχτή" : "Κλειστή"}
                </span>
                <span className="text-xs text-[#ff751f]">Διαχείριση →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}