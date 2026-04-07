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
  deadline: string;
  status: string;
}

export default function MatchdaysPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [number, setNumber] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "matchdays"), {
        number: parseInt(number),
        deadline: new Date(deadline),
        status: "open",
        createdAt: new Date(),
      });
      setNumber("");
      setDeadline("");
      fetchMatchdays();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
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

      <div className="max-w-4xl mx-auto px-10 py-12">
        <h1 className="text-3xl font-medium mb-8">Αγωνιστικές</h1>

        {/* Create form */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Νέα αγωνιστική</h2>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Αριθμός</label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] w-32"
                placeholder="π.χ. 28"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#ff751f] text-black font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-[#e6671a] disabled:opacity-50"
            >
              {saving ? "Αποθήκευση..." : "Δημιούργησε"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {matchdays.length === 0 && (
            <div className="text-gray-500 text-sm">Δεν υπάρχουν αγωνιστικές ακόμα.</div>
          )}
          {matchdays.map((m) => (
            <div key={m.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl px-6 py-4 flex justify-between items-center hover:border-[#2a2a2a]">
              <div>
                <div className="font-medium">Αγωνιστική #{m.number}</div>
                <div className="text-xs text-gray-500 mt-1">Deadline: {new Date(m.deadline).toLocaleString("el-GR")}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded font-medium ${m.status === "open" ? "bg-green-900 text-green-400" : "bg-[#222] text-gray-500"}`}>
                  {m.status === "open" ? "Ανοιχτή" : "Κλειστή"}
                </span>
                <a href={`/admin/matchdays/${m.id}`} className="text-xs text-[#ff751f] hover:underline">
                  Διαχείριση →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}