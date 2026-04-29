"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EUROLEAGUE_TEAMS } from "@/lib/teams";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

interface HCPLine {
  team: "home" | "away";
  line: number;
  points: number;
  result: string | null;
}

interface OULine {
  type: "over" | "under";
  line: number;
  points: number;
  result: string | null;
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: any;
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

  const [matchday, setMatchday] = useState<{number: number, name?: string, deadline: any} | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [matchdayName, setMatchdayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [date, setDate] = useState("");
  const [homePoints, setHomePoints] = useState("");
  const [awayPoints, setAwayPoints] = useState("");

  const [hcpLines, setHcpLines] = useState<{team: string, line: string, points: string}[]>([
    { team: "home", line: "", points: "" }
  ]);

  const [ouLines, setOuLines] = useState<{type: string, line: string, points: string}[]>([
    { type: "over", line: "", points: "" }
  ]);

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) { fetchMatchday(); fetchGames(); }
  }, [user]);

  const fetchMatchday = async () => {
    const docSnap = await getDoc(doc(db, "matchdays", matchdayId));
    if (docSnap.exists()) {
      const data = docSnap.data() as {number: number, name?: string, deadline: any};
      setMatchday(data);
      setMatchdayName(data.name || `Αγωνιστική #${data.number}`);
    }
  };

  const fetchGames = async () => {
    const q = query(collection(db, "matchdays", matchdayId, "games"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    setGames(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game)));
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateDoc(doc(db, "matchdays", matchdayId), { name: matchdayName });
      setMatchday(prev => prev ? { ...prev, name: matchdayName } : prev);
      setEditingName(false);
    } catch (err) { console.error(err); }
    finally { setSavingName(false); }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const handicapLines = hcpLines
        .filter(l => l.line && l.points)
        .map(l => ({
          team: l.team,
          line: parseFloat(l.line),
          points: parseInt(l.points),
          result: null,
        }));

      const ouLinesData = ouLines
        .filter(l => l.line && l.points)
        .map(l => ({
          type: l.type,
          line: parseFloat(l.line),
          points: parseInt(l.points),
          result: null,
        }));

      await addDoc(collection(db, "matchdays", matchdayId, "games"), {
        homeTeam, awayTeam, date: new Date(date),
        homePoints: parseInt(homePoints),
        awayPoints: parseInt(awayPoints),
        handicapLines,
        ouLines: ouLinesData,
        status: "pending",
        result: null,
        createdAt: new Date(),
      });

      setHomeTeam(""); setAwayTeam(""); setDate("");
      setHomePoints(""); setAwayPoints("");
      setHcpLines([{ team: "home", line: "", points: "" }]);
      setOuLines([{ type: "over", line: "", points: "" }]);
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
    if (!confirm("Σίγουρα;")) return;
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
        if (!predData.picks?.[game.id]) continue;
        const isCorrect = predData.picks[game.id] === value;
        const pointsEarned = isCorrect ? (value === "home" ? game.homePoints : game.awayPoints) : -1;
        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const handleSetHCPResult = async (game: Game, lineIndex: number, won: boolean) => {
    if (!confirm("Σίγουρα;")) return;
    const key = `${game.id}_hcp_${lineIndex}`;
    setGrading(key);
    try {
      const updatedLines = game.handicapLines.map((l, i) =>
        i === lineIndex ? { ...l, result: won ? "win" : "loss" } : l
      );
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), { handicapLines: updatedLines });

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const line = game.handicapLines[lineIndex];

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;
        const pickKey = `${game.id}_hcp_${lineIndex}`;
        if (!predData.picks?.[pickKey]) continue;
        const pointsEarned = won ? line.points : -1;
        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const handleSetOUResult = async (game: Game, lineIndex: number, won: boolean) => {
    if (!confirm("Σίγουρα;")) return;
    const key = `${game.id}_ou_${lineIndex}`;
    setGrading(key);
    try {
      const updatedLines = game.ouLines.map((l, i) =>
        i === lineIndex ? { ...l, result: won ? "win" : "loss" } : l
      );
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), { ouLines: updatedLines });

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const line = game.ouLines[lineIndex];

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;
        const pickKey = `${game.id}_ou_${lineIndex}`;
        if (!predData.picks?.[pickKey]) continue;
        const pointsEarned = won ? line.points : -1;
        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
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
          <div className="flex-1 mr-4">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input type="text" value={matchdayName} onChange={(e) => setMatchdayName(e.target.value)}
                  className="bg-[#151515] border border-[#ff751f]/50 rounded-xl px-4 py-2 text-lg font-black text-white focus:outline-none focus:border-[#ff751f] flex-1"
                  autoFocus />
                <button onClick={handleSaveName} disabled={savingName}
                  className="bg-[#ff751f] text-black font-black px-4 py-2 rounded-xl text-sm hover:bg-[#e6671a] disabled:opacity-50">
                  {savingName ? "..." : "✓"}
                </button>
                <button onClick={() => setEditingName(false)}
                  className="border border-[#333] text-gray-400 px-4 py-2 rounded-xl text-sm hover:bg-[#1a1a1a]">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black">{matchday?.name || `Αγωνιστική #${matchday?.number}`}</h1>
                <button onClick={() => setEditingName(true)}
                  className="text-xs text-gray-600 border border-[#333] px-2.5 py-1 rounded-lg hover:border-[#ff751f] hover:text-[#ff751f] transition-all">
                  ✏️ Μετονομασία
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Deadline: {formatDate(matchday?.deadline)}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-black px-5 py-2.5 rounded-xl text-sm hover:bg-[#e6671a] flex-shrink-0">
            + Πρόσθεσε ματς
          </button>
        </div>

        {showForm && (
          <div className="bg-[#0f0f0f] border border-[#ff751f]/30 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-black mb-4">Νέο ματς</h2>
            <form onSubmit={handleAddGame} className="flex flex-col gap-4">
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
                    <label className="text-xs text-gray-500 mb-1 block">Πόντοι {homeTeam || "γηπ."}</label>
                    <input type="number" step="1" min="1" max="9" value={homePoints} onChange={(e) => setHomePoints(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="7" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Πόντοι {awayTeam || "φιλ."}</label>
                    <input type="number" step="1" min="1" max="9" value={awayPoints} onChange={(e) => setAwayPoints(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="3" required />
                  </div>
                </div>
              </div>

              {/* HCP Lines */}
              <div className="border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-blue-400 font-black">HANDICAP LINES</div>
                  <button type="button" onClick={() => setHcpLines([...hcpLines, { team: "home", line: "", points: "" }])}
                    className="text-xs text-[#ff751f] border border-[rgba(255,117,31,0.3)] px-2.5 py-1 rounded-lg hover:bg-[rgba(255,117,31,0.1)]">
                    + Γραμμή
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-1">
  <span className="text-xs text-gray-600">Ομάδα</span>
  <span className="text-xs text-gray-600">Line</span>
  <span className="text-xs text-gray-600">Πόντοι</span>
</div>
                {hcpLines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={l.team} onChange={(e) => {
                      const updated = [...hcpLines]; updated[i].team = e.target.value; setHcpLines(updated);
                    }} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#ff751f]">
                      <option value="home">{homeTeam || "Γηπ."}</option>
                      <option value="away">{awayTeam || "Φιλ."}</option>
                    </select>
                    <input type="number" step="0.5" value={l.line} onChange={(e) => {
                      const updated = [...hcpLines]; updated[i].line = e.target.value; setHcpLines(updated);
                    }} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="-18.5" />
                    <input type="number" step="1" min="1" max="9" value={l.points} onChange={(e) => {
                      const updated = [...hcpLines]; updated[i].points = e.target.value; setHcpLines(updated);
                    }} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="9" />
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
                  <button type="button" onClick={() => setOuLines([...ouLines, { type: "over", line: "", points: "" }])}
                    className="text-xs text-[#ff751f] border border-[rgba(255,117,31,0.3)] px-2.5 py-1 rounded-lg hover:bg-[rgba(255,117,31,0.1)]">
                    + Γραμμή
                  </button>
                </div>
                {ouLines.map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={l.type} onChange={(e) => {
                      const updated = [...ouLines]; updated[i].type = e.target.value; setOuLines(updated);
                    }} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#ff751f]">
                      <option value="over">Over</option>
                      <option value="under">Under</option>
                    </select>
                    <input type="number" step="0.5" value={l.line} onChange={(e) => {
                      const updated = [...ouLines]; updated[i].line = e.target.value; setOuLines(updated);
                    }} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="160.5" />
                    <input type="number" step="1" min="1" max="9" value={l.points} onChange={(e) => {
                      const updated = [...ouLines]; updated[i].points = e.target.value; setOuLines(updated);
                    }} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="1" />
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
                    className="text-xs border border-[#333] text-gray-600 px-2.5 py-1 rounded-lg hover:border-red-500 hover:text-red-400">
                    ✕
                  </button>
                </div>
              </div>

              {/* 1/2 */}
              <div className="border-t border-[#1a1a1a] pt-3 mb-3">
                <div className="text-xs text-gray-500 mb-2">
                  1/2 {g.result ? "→ " + (g.result === "home" ? g.homeTeam : g.awayTeam) : "(αποτέλεσμα;)"}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSetResult(g, "home")} disabled={!!grading}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${g.result === "home" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                    {g.homeTeam}
                  </button>
                  <button onClick={() => handleSetResult(g, "away")} disabled={!!grading}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${g.result === "away" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                    {g.awayTeam}
                  </button>
                </div>
              </div>

              {/* HCP */}
              {g.handicapLines?.length > 0 && (
                <div className="border-t border-[#1a1a1a] pt-3 mb-3">
                  <div className="text-xs text-blue-400 font-black mb-2">HANDICAP</div>
                  <div className="flex flex-col gap-2">
                    {g.handicapLines.map((l, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-32 flex-shrink-0">
                          {l.team === "home" ? g.homeTeam : g.awayTeam} {l.line > 0 ? "+" : ""}{l.line}
                          <span className="text-[#ff751f] ml-1">+{l.points}πτς</span>
                        </span>
                        <button onClick={() => handleSetHCPResult(g, i, true)} disabled={!!grading}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold disabled:opacity-50 ${l.result === "win" ? "bg-green-600 text-white" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-green-500"}`}>
                          ✓ Κέρδισε
                        </button>
                        <button onClick={() => handleSetHCPResult(g, i, false)} disabled={!!grading}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold disabled:opacity-50 ${l.result === "loss" ? "bg-red-700 text-white" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-red-500"}`}>
                          ✗ Έχασε
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OU */}
              {g.ouLines?.length > 0 && (
                <div className="border-t border-[#1a1a1a] pt-3">
                  <div className="text-xs text-green-400 font-black mb-2">OVER/UNDER</div>
                  <div className="flex flex-col gap-2">
                    {g.ouLines.map((l, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-32 flex-shrink-0">
                          {l.type === "over" ? "Over" : "Under"} {l.line}
                          <span className="text-[#ff751f] ml-1">+{l.points}πτς</span>
                        </span>
                        <button onClick={() => handleSetOUResult(g, i, true)} disabled={!!grading}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold disabled:opacity-50 ${l.result === "win" ? "bg-green-600 text-white" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-green-500"}`}>
                          ✓ Κέρδισε
                        </button>
                        <button onClick={() => handleSetOUResult(g, i, false)} disabled={!!grading}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold disabled:opacity-50 ${l.result === "loss" ? "bg-red-700 text-white" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-red-500"}`}>
                          ✗ Έχασε
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}