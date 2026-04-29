"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EUROLEAGUE_TEAMS } from "@/lib/teams";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

interface HCPLine {
  line: number;
  homeOdds: number;
  awayOdds: number;
  homePoints: number;
  awayPoints: number;
  result: string | null;
}

interface OULine {
  line: number;
  overOdds: number;
  underOdds: number;
  overPoints: number;
  underPoints: number;
  result: string | null;
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: any;
  homeOdds: number;
  awayOdds: number;
  homePoints: number;
  awayPoints: number;
  handicapLines: HCPLine[];
  ouLines: OULine[];
  status: string;
  result: string | null;
}

export default function MatchdayDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchdayId = params.id as string;

  const [matchday, setMatchday] = useState<{number: number, deadline: any} | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState<string | null>(null);

  // New game form
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [date, setDate] = useState("");
  const [homeOdds, setHomeOdds] = useState("");
  const [awayOdds, setAwayOdds] = useState("");

  // HCP lines
  const [hcpLines, setHcpLines] = useState<{line: string, homeOdds: string, awayOdds: string}[]>([
    { line: "", homeOdds: "", awayOdds: "" }
  ]);

  // OU lines
  const [ouLines, setOuLines] = useState<{line: string, overOdds: string, underOdds: string}[]>([
    { line: "", overOdds: "", underOdds: "" }
  ]);

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) { fetchMatchday(); fetchGames(); }
  }, [user]);

  const fetchMatchday = async () => {
    const docSnap = await getDoc(doc(db, "matchdays", matchdayId));
    if (docSnap.exists()) setMatchday(docSnap.data() as {number: number, deadline: any});
  };

  const fetchGames = async () => {
    const q = query(collection(db, "matchdays", matchdayId, "games"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    setGames(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game)));
  };

  const calcPoints = (h: number, a: number) => {
    const total = 1 / h + 1 / a;
    const homeProb = (1 / h) / total;
    const hp = Math.round(homeProb * 10);
    const ap = 10 - hp;
    return { homePoints: Math.max(1, hp), awayPoints: Math.max(1, ap) };
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { homePoints, awayPoints } = calcPoints(parseFloat(homeOdds), parseFloat(awayOdds));

      const handicapLines = hcpLines
        .filter(l => l.line && l.homeOdds && l.awayOdds)
        .map(l => {
          const pts = calcPoints(parseFloat(l.homeOdds), parseFloat(l.awayOdds));
          return {
            line: parseFloat(l.line),
            homeOdds: parseFloat(l.homeOdds),
            awayOdds: parseFloat(l.awayOdds),
            homePoints: pts.homePoints,
            awayPoints: pts.awayPoints,
            result: null,
          };
        });

      const ouLinesData = ouLines
        .filter(l => l.line && l.overOdds && l.underOdds)
        .map(l => {
          const pts = calcPoints(parseFloat(l.overOdds), parseFloat(l.underOdds));
          return {
            line: parseFloat(l.line),
            overOdds: parseFloat(l.overOdds),
            underOdds: parseFloat(l.underOdds),
            overPoints: pts.homePoints,
            underPoints: pts.awayPoints,
            result: null,
          };
        });

      await addDoc(collection(db, "matchdays", matchdayId, "games"), {
        homeTeam, awayTeam, date: new Date(date),
        homeOdds: parseFloat(homeOdds), awayOdds: parseFloat(awayOdds),
        homePoints, awayPoints,
        handicapLines,
        ouLines: ouLinesData,
        status: "pending",
        result: null,
        createdAt: new Date(),
      });

      // Reset
      setHomeTeam(""); setAwayTeam(""); setDate("");
      setHomeOdds(""); setAwayOdds("");
      setHcpLines([{ line: "", homeOdds: "", awayOdds: "" }]);
      setOuLines([{ line: "", overOdds: "", underOdds: "" }]);
      setShowForm(false);
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm("Σίγουρα θέλεις να διαγράψεις αυτό το ματς;")) return;
    try {
      await deleteDoc(doc(db, "matchdays", matchdayId, "games", gameId));
      fetchGames();
    } catch (err) { console.error(err); }
  };

  const handleSetResult = async (game: Game, value: string) => {
    if (!confirm("Σίγουρα; Αυτό θα ενημερώσει τους πόντους όλων των παικτών.")) return;
    setGrading(game.id + "result");
    try {
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), {
        result: value, status: "finished"
      });

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;
        const picks = predData.picks || {};
        if (!picks[game.id]) continue;

        const isCorrect = picks[game.id] === value;
        const pointsEarned = isCorrect ? (value === "home" ? game.homePoints : game.awayPoints) : -1;

        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
        }
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const handleSetHCPResult = async (game: Game, lineIndex: number, value: string) => {
    if (!confirm("Σίγουρα;")) return;
    const key = `${game.id}_hcp_${lineIndex}`;
    setGrading(key);
    try {
      const updatedLines = game.handicapLines.map((l, i) =>
        i === lineIndex ? { ...l, result: value } : l
      );
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), {
        handicapLines: updatedLines
      });

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const line = game.handicapLines[lineIndex];

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;
        const picks = predData.picks || {};
        const pickKey = `${game.id}_hcp_${lineIndex}`;
        if (!picks[pickKey]) continue;

        const isCorrect = picks[pickKey] === value;
        const pointsEarned = isCorrect
          ? (value === "home" ? line.homePoints : line.awayPoints)
          : -1;

        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
        }
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const handleSetOUResult = async (game: Game, lineIndex: number, value: string) => {
    if (!confirm("Σίγουρα;")) return;
    const key = `${game.id}_ou_${lineIndex}`;
    setGrading(key);
    try {
      const updatedLines = game.ouLines.map((l, i) =>
        i === lineIndex ? { ...l, result: value } : l
      );
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), {
        ouLines: updatedLines
      });

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const line = game.ouLines[lineIndex];

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;
        const picks = predData.picks || {};
        const pickKey = `${game.id}_ou_${lineIndex}`;
        if (!picks[pickKey]) continue;

        const isCorrect = picks[pickKey] === value;
        const pointsEarned = isCorrect
          ? (value === "over" ? line.overPoints : line.underPoints)
          : -1;

        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
        }
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("el-GR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const points = homeOdds && awayOdds ? calcPoints(parseFloat(homeOdds), parseFloat(awayOdds)) : null;

  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">Φόρτωση...</div>;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center px-10 gap-4">
        <a href="/" className="font-bold text-2xl tracking-widest">
          <span className="text-[#ff751f]">COURT</span>
          <span className="text-white">PROPHET</span>
        </a>
        <span className="text-xs text-gray-500 border border-[#333] px-2 py-1 rounded">ADMIN</span>
        <a href="/admin/matchdays" className="text-xs text-gray-500 hover:text-white ml-4">← Πίσω</a>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-black">Αγωνιστική #{matchday?.number}</h1>
            <p className="text-xs text-gray-500 mt-1">Deadline: {formatDate(matchday?.deadline)}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-black px-5 py-2.5 rounded-xl text-sm hover:bg-[#e6671a]">
            + Πρόσθεσε ματς
          </button>
        </div>

        {showForm && (
          <div className="bg-[#0f0f0f] border border-[#ff751f]/30 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-black mb-4">Νέο ματς</h2>
            <form onSubmit={handleAddGame} className="flex flex-col gap-4">
              {/* Teams */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Γηπεδούχος</label>
                  <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]" required>
                    <option value="">Επέλεξε...</option>
                    {EUROLEAGUE_TEAMS.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Φιλοξενούμενος</label>
                  <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]" required>
                    <option value="">Επέλεξε...</option>
                    {EUROLEAGUE_TEAMS.filter(t => t.name !== homeTeam).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Ημερομηνία</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]" required />
              </div>

              {/* 1/2 */}
              <div className="border border-[#2a2a2a] rounded-xl p-4">
                <div className="text-xs text-[#ff751f] font-black mb-3">1/2 — Νικητής</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση {homeTeam || "γηπ."}</label>
                    <input type="number" step="0.01" value={homeOdds} onChange={(e) => setHomeOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="1.40" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση {awayTeam || "φιλ."}</label>
                    <input type="number" step="0.01" value={awayOdds} onChange={(e) => setAwayOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="3.20" required />
                  </div>
                </div>
                {points && (
                  <div className="mt-2 text-xs text-gray-500">
                    {homeTeam || "Γηπ."} <span className="text-[#ff751f]">+{points.homePoints}</span> · {awayTeam || "Φιλ."} <span className="text-[#ff751f]">+{points.awayPoints}</span>
                  </div>
                )}
              </div>

              {/* HCP Lines */}
              <div className="border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-blue-400 font-black">HANDICAP LINES</div>
                  <button type="button" onClick={() => setHcpLines([...hcpLines, { line: "", homeOdds: "", awayOdds: "" }])}
                    className="text-xs text-[#ff751f] border border-[rgba(255,117,31,0.3)] px-2.5 py-1 rounded-lg hover:bg-[rgba(255,117,31,0.1)]">
                    + Line
                  </button>
                </div>
                {hcpLines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1">
                      {i === 0 && <label className="text-xs text-gray-600 mb-1 block">Line</label>}
                      <input type="number" step="0.5" value={l.line} onChange={(e) => {
                        const updated = [...hcpLines]; updated[i].line = e.target.value; setHcpLines(updated);
                      }} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                        placeholder="-9.5" />
                    </div>
                    <div className="flex-1">
                      {i === 0 && <label className="text-xs text-gray-600 mb-1 block">Απόδ. {homeTeam || "Γηπ."}</label>}
                      <input type="number" step="0.01" value={l.homeOdds} onChange={(e) => {
                        const updated = [...hcpLines]; updated[i].homeOdds = e.target.value; setHcpLines(updated);
                      }} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                        placeholder="1.85" />
                    </div>
                    <div className="flex-1">
                      {i === 0 && <label className="text-xs text-gray-600 mb-1 block">Απόδ. {awayTeam || "Φιλ."}</label>}
                      <input type="number" step="0.01" value={l.awayOdds} onChange={(e) => {
                        const updated = [...hcpLines]; updated[i].awayOdds = e.target.value; setHcpLines(updated);
                      }} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                        placeholder="1.85" />
                    </div>
                    {hcpLines.length > 1 && (
                      <button type="button" onClick={() => setHcpLines(hcpLines.filter((_, j) => j !== i))}
                        className="text-red-400 text-xs px-2 py-2 border border-[#333] rounded-lg hover:border-red-500">✕</button>
                    )}
                  </div>
                ))}
              </div>

              {/* OU Lines */}
              <div className="border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-green-400 font-black">OVER/UNDER LINES</div>
                  <button type="button" onClick={() => setOuLines([...ouLines, { line: "", overOdds: "", underOdds: "" }])}
                    className="text-xs text-[#ff751f] border border-[rgba(255,117,31,0.3)] px-2.5 py-1 rounded-lg hover:bg-[rgba(255,117,31,0.1)]">
                    + Line
                  </button>
                </div>
                {ouLines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1">
                      {i === 0 && <label className="text-xs text-gray-600 mb-1 block">Line</label>}
                      <input type="number" step="0.5" value={l.line} onChange={(e) => {
                        const updated = [...ouLines]; updated[i].line = e.target.value; setOuLines(updated);
                      }} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                        placeholder="160.5" />
                    </div>
                    <div className="flex-1">
                      {i === 0 && <label className="text-xs text-gray-600 mb-1 block">Απόδ. Over</label>}
                      <input type="number" step="0.01" value={l.overOdds} onChange={(e) => {
                        const updated = [...ouLines]; updated[i].overOdds = e.target.value; setOuLines(updated);
                      }} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                        placeholder="1.85" />
                    </div>
                    <div className="flex-1">
                      {i === 0 && <label className="text-xs text-gray-600 mb-1 block">Απόδ. Under</label>}
                      <input type="number" step="0.01" value={l.underOdds} onChange={(e) => {
                        const updated = [...ouLines]; updated[i].underOdds = e.target.value; setOuLines(updated);
                      }} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                        placeholder="1.85" />
                    </div>
                    {ouLines.length > 1 && (
                      <button type="button" onClick={() => setOuLines(ouLines.filter((_, j) => j !== i))}
                        className="text-red-400 text-xs px-2 py-2 border border-[#333] rounded-lg hover:border-red-500">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-[#ff751f] text-black font-black px-6 py-2.5 rounded-xl text-sm hover:bg-[#e6671a] disabled:opacity-50">
                  {saving ? "Αποθήκευση..." : "Πρόσθεσε"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-[#333] text-gray-400 px-4 py-2.5 rounded-xl text-sm hover:bg-[#1a1a1a]">
                  Ακύρωση
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-black text-gray-400">Ματς ({games.length})</h2>
          {games.length === 0 && (
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-8 text-center text-gray-500 text-sm">
              Δεν υπάρχουν ματς ακόμα.
            </div>
          )}
          {games.map((g) => (
            <div key={g.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-6 py-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-black text-white">{g.homeTeam} vs {g.awayTeam}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(g.date)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
                    g.status === "pending" ? "bg-[#222] text-gray-400" :
                    g.status === "live" ? "bg-[#ff751f] text-black" :
                    "bg-green-900/50 text-green-400"
                  }`}>
                    {g.status === "pending" ? "Αναμονή" : g.status === "live" ? "LIVE" : "Τελικό"}
                  </span>
                  <button onClick={() => handleDelete(g.id)}
                    className="text-xs border border-[#333] text-gray-600 px-2.5 py-1 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors">
                    ✕
                  </button>
                </div>
              </div>

              {/* 1/2 result */}
              <div className="border-t border-[#1a1a1a] pt-3 mb-3">
                <div className="text-xs text-gray-500 mb-2">
                  1/2 {g.result ? "→ " + (g.result === "home" ? g.homeTeam : g.awayTeam) : "(αποτέλεσμα;)"}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSetResult(g, "home")} disabled={grading === g.id + "result"}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${g.result === "home" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                    {g.homeTeam}
                  </button>
                  <button onClick={() => handleSetResult(g, "away")} disabled={grading === g.id + "result"}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${g.result === "away" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                    {g.awayTeam}
                  </button>
                </div>
              </div>

              {/* HCP results */}
              {g.handicapLines?.map((l, i) => (
                <div key={i} className="border-t border-[#1a1a1a] pt-3 mb-3">
                  <div className="text-xs text-gray-500 mb-2">
                    HCP {l.line > 0 ? "+" : ""}{l.line} {l.result ? "→ " + (l.result === "home" ? g.homeTeam : g.awayTeam) : "(αποτέλεσμα;)"}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSetHCPResult(g, i, "home")} disabled={!!grading}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${l.result === "home" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      {g.homeTeam} {l.line > 0 ? "+" : ""}{l.line}
                    </button>
                    <button onClick={() => handleSetHCPResult(g, i, "away")} disabled={!!grading}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${l.result === "away" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      {g.awayTeam} {l.line > 0 ? "-" : "+"}{Math.abs(l.line)}
                    </button>
                  </div>
                </div>
              ))}

              {/* OU results */}
              {g.ouLines?.map((l, i) => (
                <div key={i} className="border-t border-[#1a1a1a] pt-3 mb-3">
                  <div className="text-xs text-gray-500 mb-2">
                    O/U {l.line} {l.result ? "→ " + (l.result === "over" ? "Over" : "Under") : "(αποτέλεσμα;)"}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSetOUResult(g, i, "over")} disabled={!!grading}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${l.result === "over" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      Over {l.line}
                    </button>
                    <button onClick={() => handleSetOUResult(g, i, "under")} disabled={!!grading}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${l.result === "under" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      Under {l.line}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}