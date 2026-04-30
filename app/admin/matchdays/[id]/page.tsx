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

interface PlayerProp {
  playerName: string;
  line: number;
  overPoints: number;
  underPoints: number;
  result: "over" | "under" | null;
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
  playerProps: PlayerProp[];
  status: string;
  result: string | null;
}

const inputCls = "w-full bg-white/5 border-2 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all";
const selectCls = "w-full bg-[#111] border-2 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f] transition-all";

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
  const [hcpLines, setHcpLines] = useState<{team: string, line: string, points: string}[]>([{ team: "home", line: "", points: "" }]);
  const [ouLines, setOuLines] = useState<{type: string, line: string, points: string}[]>([{ type: "over", line: "", points: "" }]);
  const [playerProps, setPlayerProps] = useState<{playerName: string, line: string, overPoints: string, underPoints: string}[]>([]);

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
      const handicapLines = hcpLines.filter(l => l.line && l.points).map(l => ({ team: l.team, line: parseFloat(l.line), points: parseInt(l.points), result: null }));
      const ouLinesData = ouLines.filter(l => l.line && l.points).map(l => ({ type: l.type, line: parseFloat(l.line), points: parseInt(l.points), result: null }));
      const playerPropsData = playerProps.filter(p => p.playerName && p.line && p.overPoints && p.underPoints).map(p => ({
        playerName: p.playerName,
        line: parseFloat(p.line),
        overPoints: parseInt(p.overPoints),
        underPoints: parseInt(p.underPoints),
        result: null,
      }));

      await addDoc(collection(db, "matchdays", matchdayId, "games"), {
        homeTeam, awayTeam, date: new Date(date),
        homePoints: parseInt(homePoints), awayPoints: parseInt(awayPoints),
        handicapLines, ouLines: ouLinesData, playerProps: playerPropsData,
        status: "pending", result: null, createdAt: new Date(),
      });

      setHomeTeam(""); setAwayTeam(""); setDate("");
      setHomePoints(""); setAwayPoints("");
      setHcpLines([{ team: "home", line: "", points: "" }]);
      setOuLines([{ type: "over", line: "", points: "" }]);
      setPlayerProps([]);
      setShowForm(false);
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm("Σίγουρα;")) return;
    await deleteDoc(doc(db, "matchdays", matchdayId, "games", gameId));
    fetchGames();
  };

  const handleSetResult = async (game: Game, value: string) => {
    if (!confirm("Σίγουρα;")) return;
    setGrading(game.id + "result");
    try {
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), { result: value, status: "finished" });
      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId || !predData.picks?.[game.id]) continue;
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
    setGrading(`${game.id}_hcp_${lineIndex}`);
    try {
      const updatedLines = game.handicapLines.map((l, i) => i === lineIndex ? { ...l, result: won ? "win" : "loss" } : l);
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), { handicapLines: updatedLines });
      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const line = game.handicapLines[lineIndex];
      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId || !predData.picks?.[`${game.id}_hcp_${lineIndex}`]) continue;
        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) batch.update(userRef, { points: (userSnap.data().points || 0) + (won ? line.points : -1) });
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const handleSetOUResult = async (game: Game, lineIndex: number, won: boolean) => {
    if (!confirm("Σίγουρα;")) return;
    setGrading(`${game.id}_ou_${lineIndex}`);
    try {
      const updatedLines = game.ouLines.map((l, i) => i === lineIndex ? { ...l, result: won ? "win" : "loss" } : l);
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), { ouLines: updatedLines });
      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const line = game.ouLines[lineIndex];
      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId || !predData.picks?.[`${game.id}_ou_${lineIndex}`]) continue;
        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) batch.update(userRef, { points: (userSnap.data().points || 0) + (won ? line.points : -1) });
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setGrading(null); }
  };

  const handleSetPlayerPropResult = async (game: Game, propIndex: number, result: "over" | "under") => {
    if (!confirm("Σίγουρα;")) return;
    const key = `${game.id}_prop_${propIndex}`;
    setGrading(key);
    try {
      const updatedProps = (game.playerProps || []).map((p, i) => i === propIndex ? { ...p, result } : p);
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), { playerProps: updatedProps });

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);
      const prop = game.playerProps[propIndex];

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;
        const pickKey = `${game.id}_prop_${propIndex}`;
        if (!predData.picks?.[pickKey]) continue;
        const pick = predData.picks[pickKey]; // "over" or "under"
        const isCorrect = pick === result;
        const pointsEarned = isCorrect ? (result === "over" ? prop.overPoints : prop.underPoints) : -1;
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
          <div className="bg-[#ff751f] px-2.5 py-1.5"><span className="text-black font-black text-sm tracking-tighter">COURT</span></div>
          <div className="bg-white px-2.5 py-1.5"><span className="text-black font-black text-sm tracking-tighter">PROPHET</span></div>
        </a>
        <div className="bg-white/10 px-3 py-1.5 border border-white/20 mr-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin</span>
        </div>
        <a href="/admin/matchdays" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-[#ff751f] transition-colors">← Πίσω</a>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1 mr-4">
            {editingName ? (
              <div className="flex items-center gap-0">
                <input type="text" value={matchdayName} onChange={(e) => setMatchdayName(e.target.value)}
                  className="bg-white/5 border-2 border-[#ff751f]/50 px-4 py-2.5 text-lg font-black text-white focus:outline-none focus:border-[#ff751f] flex-1" autoFocus />
                <button onClick={handleSaveName} disabled={savingName}
                  className="bg-[#ff751f] text-black font-black px-4 py-2.5 text-sm hover:bg-white disabled:opacity-50 border-2 border-[#ff751f]">
                  {savingName ? "..." : "✓"}
                </button>
                <button onClick={() => setEditingName(false)}
                  className="border-2 border-white/20 text-gray-400 px-4 py-2.5 text-sm hover:border-white transition-all">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black uppercase">{matchday?.name || `Αγωνιστική #${matchday?.number}`}</h1>
                <button onClick={() => setEditingName(true)}
                  className="text-[9px] font-black uppercase tracking-widest text-gray-600 border border-white/20 px-2.5 py-1.5 hover:border-[#ff751f] hover:text-[#ff751f] transition-all">
                  ✏️ Μετονομασία
                </button>
              </div>
            )}
            <p className="text-[10px] text-gray-600 mt-2 font-black uppercase tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
              Deadline: {formatDate(matchday?.deadline)}
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-black px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-white transition-all border-2 border-[#ff751f] flex-shrink-0">
            + Ματς
          </button>
        </div>

        {/* Add game form */}
        {showForm && (
          <div className="border-2 border-[#ff751f]/40 bg-black mb-6 overflow-hidden">
            <div className="bg-[#ff751f] px-4 py-2">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Νέο Ματς</span>
            </div>
            <div className="p-5">
              <form onSubmit={handleAddGame} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Γηπεδούχος</label>
                    <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className={selectCls} required>
                      <option value="">Επέλεξε...</option>
                      {EUROLEAGUE_TEAMS.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Φιλοξενούμενος</label>
                    <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className={selectCls} required>
                      <option value="">Επέλεξε...</option>
                      {EUROLEAGUE_TEAMS.filter(t => t.name !== homeTeam).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 block" style={{ fontFamily: "Arial, sans-serif" }}>Ημερομηνία</label>
                  <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
                </div>

                {/* 1/2 */}
                <div className="border-2 border-white/10 overflow-hidden">
                  <div className="bg-[#ff751f] px-3 py-1.5">
                    <span className="text-black text-[9px] font-black uppercase tracking-widest">1/2 — Νικητής</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-600 mb-1.5 block font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Πτς {homeTeam || "Γηπ."}</label>
                      <input type="number" step="1" min="1" max="9" value={homePoints} onChange={(e) => setHomePoints(e.target.value)} className={inputCls} placeholder="7" required />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 mb-1.5 block font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Πτς {awayTeam || "Φιλ."}</label>
                      <input type="number" step="1" min="1" max="9" value={awayPoints} onChange={(e) => setAwayPoints(e.target.value)} className={inputCls} placeholder="3" required />
                    </div>
                  </div>
                </div>

                {/* HCP */}
                <div className="border-2 border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between bg-white/5 px-3 py-2 border-b border-white/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Handicap Lines</span>
                    <button type="button" onClick={() => setHcpLines([...hcpLines, { team: "home", line: "", points: "" }])}
                      className="text-[9px] text-[#ff751f] border border-[#ff751f]/30 px-2 py-1 font-black uppercase hover:bg-[#ff751f]/10 transition-all">+ Γραμμή</button>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-[9px] text-gray-600 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Ομάδα</span>
                      <span className="text-[9px] text-gray-600 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Line</span>
                      <span className="text-[9px] text-gray-600 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Πόντοι</span>
                    </div>
                    {hcpLines.map((l, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select value={l.team} onChange={(e) => { const u = [...hcpLines]; u[i].team = e.target.value; setHcpLines(u); }} className="flex-1 bg-[#111] border-2 border-white/10 px-2 py-2 text-xs text-white focus:outline-none focus:border-[#ff751f]">
                          <option value="home">{homeTeam || "Γηπ."}</option>
                          <option value="away">{awayTeam || "Φιλ."}</option>
                        </select>
                        <input type="number" step="0.5" value={l.line} onChange={(e) => { const u = [...hcpLines]; u[i].line = e.target.value; setHcpLines(u); }}
                          className="flex-1 bg-white/5 border-2 border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]" placeholder="-18.5" />
                        <input type="number" step="1" min="1" max="9" value={l.points} onChange={(e) => { const u = [...hcpLines]; u[i].points = e.target.value; setHcpLines(u); }}
                          className="flex-1 bg-white/5 border-2 border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]" placeholder="9" />
                        {hcpLines.length > 1 && (
                          <button type="button" onClick={() => setHcpLines(hcpLines.filter((_, j) => j !== i))}
                            className="text-red-400 text-xs px-2 py-2 border-2 border-white/10 hover:border-red-500 transition-all">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* OU */}
                <div className="border-2 border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between bg-white/5 px-3 py-2 border-b border-white/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Over/Under Lines</span>
                    <button type="button" onClick={() => setOuLines([...ouLines, { type: "over", line: "", points: "" }])}
                      className="text-[9px] text-[#ff751f] border border-[#ff751f]/30 px-2 py-1 font-black uppercase hover:bg-[#ff751f]/10 transition-all">+ Γραμμή</button>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {ouLines.map((l, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select value={l.type} onChange={(e) => { const u = [...ouLines]; u[i].type = e.target.value; setOuLines(u); }} className="flex-1 bg-[#111] border-2 border-white/10 px-2 py-2 text-xs text-white focus:outline-none focus:border-[#ff751f]">
                          <option value="over">Over</option>
                          <option value="under">Under</option>
                        </select>
                        <input type="number" step="0.5" value={l.line} onChange={(e) => { const u = [...ouLines]; u[i].line = e.target.value; setOuLines(u); }}
                          className="flex-1 bg-white/5 border-2 border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]" placeholder="160.5" />
                        <input type="number" step="1" min="1" max="9" value={l.points} onChange={(e) => { const u = [...ouLines]; u[i].points = e.target.value; setOuLines(u); }}
                          className="flex-1 bg-white/5 border-2 border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]" placeholder="5" />
                        {ouLines.length > 1 && (
                          <button type="button" onClick={() => setOuLines(ouLines.filter((_, j) => j !== i))}
                            className="text-red-400 text-xs px-2 py-2 border-2 border-white/10 hover:border-red-500 transition-all">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Player Props */}
                <div className="border-2 border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between bg-white/5 px-3 py-2 border-b border-white/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">Player Props</span>
                    <button type="button" onClick={() => setPlayerProps([...playerProps, { playerName: "", line: "", overPoints: "", underPoints: "" }])}
                      className="text-[9px] text-[#ff751f] border border-[#ff751f]/30 px-2 py-1 font-black uppercase hover:bg-[#ff751f]/10 transition-all">+ Παίκτης</button>
                  </div>
                  {playerProps.length === 0 ? (
                    <div className="p-3 text-[10px] text-gray-600 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Κανένα prop ακόμα. Πάτα + για να προσθέσεις.</div>
                  ) : (
                    <div className="p-3 flex flex-col gap-3">
                      {playerProps.map((p, i) => (
                        <div key={i} className="flex flex-col gap-2 border border-white/10 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">Παίκτης {i + 1}</span>
                            <button type="button" onClick={() => setPlayerProps(playerProps.filter((_, j) => j !== i))}
                              className="text-red-400 text-xs px-2 py-1 border border-white/10 hover:border-red-500 transition-all">✕</button>
                          </div>
                          <input type="text" value={p.playerName} onChange={(e) => { const u = [...playerProps]; u[i].playerName = e.target.value; setPlayerProps(u); }}
                            className={inputCls} style={{ fontFamily: "Arial, sans-serif" }} placeholder="Όνομα παίκτη (π.χ. Σλούκας)" />
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] text-gray-600 mb-1 block font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Γραμμή</label>
                              <input type="number" step="0.5" value={p.line} onChange={(e) => { const u = [...playerProps]; u[i].line = e.target.value; setPlayerProps(u); }}
                                className={inputCls} placeholder="19.5" />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-600 mb-1 block font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Over πτς</label>
                              <input type="number" step="1" min="1" max="9" value={p.overPoints} onChange={(e) => { const u = [...playerProps]; u[i].overPoints = e.target.value; setPlayerProps(u); }}
                                className={inputCls} placeholder="6" />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-600 mb-1 block font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>Under πτς</label>
                              <input type="number" step="1" min="1" max="9" value={p.underPoints} onChange={(e) => { const u = [...playerProps]; u[i].underPoints = e.target.value; setPlayerProps(u); }}
                                className={inputCls} placeholder="4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-0">
                  <button type="submit" disabled={saving}
                    className="bg-[#ff751f] text-black font-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f]">
                    {saving ? "..." : "Πρόσθεσε"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="border-2 border-white/20 text-gray-400 px-5 py-3 text-xs font-black uppercase tracking-widest hover:border-white transition-all">
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Games list */}
        <div className="flex items-center gap-0 mb-4">
          <div className="bg-white px-4 py-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Ματς</span>
          </div>
          <div className="bg-white/10 px-4 py-2">
            <span className="text-white text-[9px] font-black tracking-[4px] uppercase">{games.length} συνολικά</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {games.length === 0 && (
            <div className="border-2 border-white/10 bg-black p-10 text-center">
              <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>Δεν υπάρχουν ματς ακόμα.</div>
            </div>
          )}
          {games.map((g) => (
            <div key={g.id} className="border-2 border-white/10 bg-black overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/10">
                <div>
                  <div className="text-sm font-black uppercase">{g.homeTeam} <span className="text-[#ff751f]">vs</span> {g.awayTeam}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>{formatDate(g.date)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-1 font-black uppercase tracking-widest border ${
                    g.status === "pending" ? "border-white/20 text-gray-500" :
                    g.status === "live" ? "bg-[#ff751f] border-[#ff751f] text-black" :
                    "border-green-500/30 text-green-400"
                  }`}>
                    {g.status === "pending" ? "Αναμονή" : g.status === "live" ? "LIVE" : "✓ Τελικό"}
                  </span>
                  <button onClick={() => handleDelete(g.id)}
                    className="text-[10px] border-2 border-white/10 text-gray-600 px-2.5 py-1 font-black hover:border-red-500 hover:text-red-400 transition-all">✕</button>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* 1/2 */}
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#ff751f] mb-2">
                    1/2 {g.result ? `→ ${g.result === "home" ? g.homeTeam : g.awayTeam}` : "— Ορισμός αποτελέσματος"}
                  </div>
                  <div className="flex gap-0">
                    <button onClick={() => handleSetResult(g, "home")} disabled={!!grading}
                      className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                        g.result === "home" ? "bg-[#ff751f] border-[#ff751f] text-black" : "bg-transparent border-white/10 text-white hover:border-[#ff751f]/50"
                      }`}>{g.homeTeam}</button>
                    <button onClick={() => handleSetResult(g, "away")} disabled={!!grading}
                      className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-l-0 transition-all disabled:opacity-50 ${
                        g.result === "away" ? "bg-[#ff751f] border-[#ff751f] text-black" : "bg-transparent border-white/10 text-white hover:border-[#ff751f]/50"
                      }`}>{g.awayTeam}</button>
                  </div>
                </div>

                {/* HCP */}
                {g.handicapLines?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">Handicap</div>
                    <div className="flex flex-col gap-2">
                      {g.handicapLines.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-36 flex-shrink-0 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>
                            {l.team === "home" ? g.homeTeam : g.awayTeam} {l.line > 0 ? "+" : ""}{l.line}
                            <span className="text-[#ff751f] ml-1">+{l.points}πτς</span>
                          </span>
                          <button onClick={() => handleSetHCPResult(g, i, true)} disabled={!!grading}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                              l.result === "win" ? "bg-green-600 border-green-600 text-white" : "border-white/10 text-white hover:border-green-500"
                            }`}>✓ Κέρδισε</button>
                          <button onClick={() => handleSetHCPResult(g, i, false)} disabled={!!grading}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                              l.result === "loss" ? "bg-red-700 border-red-700 text-white" : "border-white/10 text-white hover:border-red-500"
                            }`}>✗ Έχασε</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OU */}
                {g.ouLines?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-green-400 mb-2">Over / Under</div>
                    <div className="flex flex-col gap-2">
                      {g.ouLines.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-36 flex-shrink-0 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>
                            {l.type === "over" ? "Over" : "Under"} {l.line}
                            <span className="text-[#ff751f] ml-1">+{l.points}πτς</span>
                          </span>
                          <button onClick={() => handleSetOUResult(g, i, true)} disabled={!!grading}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                              l.result === "win" ? "bg-green-600 border-green-600 text-white" : "border-white/10 text-white hover:border-green-500"
                            }`}>✓ Κέρδισε</button>
                          <button onClick={() => handleSetOUResult(g, i, false)} disabled={!!grading}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                              l.result === "loss" ? "bg-red-700 border-red-700 text-white" : "border-white/10 text-white hover:border-red-500"
                            }`}>✗ Έχασε</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player Props */}
                {g.playerProps?.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-2">Player Props</div>
                    <div className="flex flex-col gap-2">
                      {g.playerProps.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-36 flex-shrink-0 font-black uppercase leading-tight" style={{ fontFamily: "Arial, sans-serif" }}>
                            {p.playerName}<br />
                            <span className="text-yellow-400">{p.line} pts</span>
                          </span>
                          <button onClick={() => handleSetPlayerPropResult(g, i, "over")} disabled={!!grading}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                              p.result === "over" ? "bg-green-600 border-green-600 text-white" : "border-white/10 text-white hover:border-green-500"
                            }`}>Over +{p.overPoints}πτς</button>
                          <button onClick={() => handleSetPlayerPropResult(g, i, "under")} disabled={!!grading}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${
                              p.result === "under" ? "bg-red-700 border-red-700 text-white" : "border-white/10 text-white hover:border-red-500"
                            }`}>Under +{p.underPoints}πτς</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}