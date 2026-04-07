"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, doc, getDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  homePoints: number;
  awayPoints: number;
  status: string;
}

export default function MatchdayDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchdayId = params.id as string;

  const [matchday, setMatchday] = useState<{number: number, deadline: string} | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [date, setDate] = useState("");
  const [homeOdds, setHomeOdds] = useState("");
  const [awayOdds, setAwayOdds] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchMatchday();
      fetchGames();
    }
  }, [user]);

  const fetchMatchday = async () => {
    const docRef = doc(db, "matchdays", matchdayId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setMatchday(docSnap.data() as {number: number, deadline: string});
    }
  };

  const fetchGames = async () => {
    const q = query(collection(db, "matchdays", matchdayId, "games"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    setGames(data);
  };

  // Υπολογισμός πόντων από odds
  const calcPoints = (homeOdds: number, awayOdds: number) => {
    const total = 1 / homeOdds + 1 / awayOdds;
    const homeProb = (1 / homeOdds) / total;
    const awayProb = (1 / awayOdds) / total;
    const homePoints = Math.round(homeProb * 10);
    const awayPoints = 10 - homePoints;
    return { homePoints: Math.max(1, homePoints), awayPoints: Math.max(1, awayPoints) };
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { homePoints, awayPoints } = calcPoints(parseFloat(homeOdds), parseFloat(awayOdds));
      await addDoc(collection(db, "matchdays", matchdayId, "games"), {
        homeTeam,
        awayTeam,
        date: new Date(date),
        homeOdds: parseFloat(homeOdds),
        awayOdds: parseFloat(awayOdds),
        homePoints,
        awayPoints,
        status: "pending",
        result: null,
        createdAt: new Date(),
      });
      setHomeTeam("");
      setAwayTeam("");
      setDate("");
      setHomeOdds("");
      setAwayOdds("");
      fetchGames();
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
        <a href="/admin/matchdays" className="text-xs text-gray-500 hover:text-white ml-4">← Πίσω</a>
      </nav>

      <div className="max-w-4xl mx-auto px-10 py-12">
        <h1 className="text-3xl font-medium mb-2">
          Αγωνιστική #{matchday?.number}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Deadline: {matchday?.deadline ? new Date(matchday.deadline).toLocaleString("el-GR") : ""}
        </p>

        {/* Add game form */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Προσθήκη ματς</h2>
          <form onSubmit={handleAddGame} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Γηπεδούχος</label>
                <input
                  type="text"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  placeholder="π.χ. Ολυμπιακός"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Φιλοξενούμενος</label>
                <input
                  type="text"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  placeholder="π.χ. Βιλερμπάν"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Ημερομηνία</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Απόδοση γηπεδούχου</label>
                <input
                  type="number"
                  step="0.01"
                  value={homeOdds}
                  onChange={(e) => setHomeOdds(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  placeholder="π.χ. 1.40"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Απόδοση φιλοξενούμενου</label>
                <input
                  type="number"
                  step="0.01"
                  value={awayOdds}
                  onChange={(e) => setAwayOdds(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                  placeholder="π.χ. 3.20"
                  required
                />
              </div>
            </div>
            {homeOdds && awayOdds && (
              <div className="text-xs text-gray-500 bg-[#1a1a1a] rounded-lg px-4 py-2.5">
                Πόντοι: <span className="text-white">{calcPoints(parseFloat(homeOdds), parseFloat(awayOdds)).homePoints}</span> για {homeTeam || "γηπεδούχο"} · <span className="text-white">{calcPoints(parseFloat(homeOdds), parseFloat(awayOdds)).awayPoints}</span> για {awayTeam || "φιλοξενούμενο"}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-[#ff751f] text-black font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-[#e6671a] disabled:opacity-50 self-start"
            >
              {saving ? "Αποθήκευση..." : "Πρόσθεσε ματς"}
            </button>
          </form>
        </div>

        {/* Games list */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Ματς ({games.length})</h2>
          {games.length === 0 && (
            <div className="text-gray-500 text-sm">Δεν υπάρχουν ματς ακόμα.</div>
          )}
          {games.map((g) => (
            <div key={g.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl px-6 py-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{g.homeTeam} vs {g.awayTeam}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(g.date).toLocaleString("el-GR")} · +{g.homePoints} / +{g.awayPoints} πόντοι
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${g.status === "pending" ? "bg-[#222] text-gray-400" : g.status === "live" ? "bg-[#ff751f] text-black" : "bg-green-900 text-green-400"}`}>
                {g.status === "pending" ? "Αναμονή" : g.status === "live" ? "LIVE" : "Τελικό"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}