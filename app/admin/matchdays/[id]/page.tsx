"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EUROLEAGUE_TEAMS } from "@/lib/teams";

const ADMIN_EMAIL = "georgelipas05@gmail.com";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: any;
  homeOdds: number;
  awayOdds: number;
  homePoints: number;
  awayPoints: number;
  handicapLine: number;
  handicapHomeOdds: number;
  handicapAwayOdds: number;
  handicapHomePoints: number;
  handicapAwayPoints: number;
  ouLine: number;
  overOdds: number;
  underOdds: number;
  overPoints: number;
  underPoints: number;
  status: string;
  result: string | null;
  handicapResult: string | null;
  ouResult: string | null;
}

interface EditState {
  homeTeam: string;
  awayTeam: string;
  date: string;
  homeOdds: string;
  awayOdds: string;
  handicapLine: string;
  handicapHomeOdds: string;
  handicapAwayOdds: string;
  ouLine: string;
  overOdds: string;
  underOdds: string;
}

export default function MatchdayDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchdayId = params.id as string;

  const [matchday, setMatchday] = useState<{number: number, deadline: any} | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [date, setDate] = useState("");
  const [homeOdds, setHomeOdds] = useState("");
  const [awayOdds, setAwayOdds] = useState("");
  const [handicapLine, setHandicapLine] = useState("");
  const [handicapHomeOdds, setHandicapHomeOdds] = useState("");
  const [handicapAwayOdds, setHandicapAwayOdds] = useState("");
  const [ouLine, setOuLine] = useState("");
  const [overOdds, setOverOdds] = useState("");
  const [underOdds, setUnderOdds] = useState("");
  const [saving, setSaving] = useState(false);
  const [grading, setGrading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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
    const homePoints = Math.round(homeProb * 10);
    const awayPoints = 10 - homePoints;
    return { homePoints: Math.max(1, homePoints), awayPoints: Math.max(1, awayPoints) };
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { homePoints, awayPoints } = calcPoints(parseFloat(homeOdds), parseFloat(awayOdds));
      const hcp = calcPoints(parseFloat(handicapHomeOdds), parseFloat(handicapAwayOdds));
      const ou = calcPoints(parseFloat(overOdds), parseFloat(underOdds));

      await addDoc(collection(db, "matchdays", matchdayId, "games"), {
        homeTeam, awayTeam, date: new Date(date),
        homeOdds: parseFloat(homeOdds), awayOdds: parseFloat(awayOdds),
        homePoints, awayPoints,
        handicapLine: parseFloat(handicapLine),
        handicapHomeOdds: parseFloat(handicapHomeOdds),
        handicapAwayOdds: parseFloat(handicapAwayOdds),
        handicapHomePoints: hcp.homePoints,
        handicapAwayPoints: hcp.awayPoints,
        ouLine: parseFloat(ouLine),
        overOdds: parseFloat(overOdds),
        underOdds: parseFloat(underOdds),
        overPoints: ou.homePoints,
        underPoints: ou.awayPoints,
        status: "pending",
        result: null,
        handicapResult: null,
        ouResult: null,
        createdAt: new Date(),
      });
      setHomeTeam(""); setAwayTeam(""); setDate("");
      setHomeOdds(""); setAwayOdds("");
      setHandicapLine(""); setHandicapHomeOdds(""); setHandicapAwayOdds("");
      setOuLine(""); setOverOdds(""); setUnderOdds("");
      setShowForm(false);
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const startEdit = (g: Game) => {
    setEditingId(g.id);
    const d = g.date.toDate ? g.date.toDate() : new Date(g.date);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localDate = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditState({
      homeTeam: g.homeTeam, awayTeam: g.awayTeam, date: localDate,
      homeOdds: String(g.homeOdds || ""), awayOdds: String(g.awayOdds || ""),
      handicapLine: String(g.handicapLine || ""), handicapHomeOdds: String(g.handicapHomeOdds || ""), handicapAwayOdds: String(g.handicapAwayOdds || ""),
      ouLine: String(g.ouLine || ""), overOdds: String(g.overOdds || ""), underOdds: String(g.underOdds || ""),
    });
  };

  const handleEditSave = async (gameId: string) => {
    if (!editState) return;
    setEditSaving(true);
    try {
      const { homePoints, awayPoints } = calcPoints(parseFloat(editState.homeOdds), parseFloat(editState.awayOdds));
      const hcp = calcPoints(parseFloat(editState.handicapHomeOdds), parseFloat(editState.handicapAwayOdds));
      const ou = calcPoints(parseFloat(editState.overOdds), parseFloat(editState.underOdds));
      await updateDoc(doc(db, "matchdays", matchdayId, "games", gameId), {
        homeTeam: editState.homeTeam, awayTeam: editState.awayTeam, date: new Date(editState.date),
        homeOdds: parseFloat(editState.homeOdds), awayOdds: parseFloat(editState.awayOdds),
        homePoints, awayPoints,
        handicapLine: parseFloat(editState.handicapLine),
        handicapHomeOdds: parseFloat(editState.handicapHomeOdds),
        handicapAwayOdds: parseFloat(editState.handicapAwayOdds),
        handicapHomePoints: hcp.homePoints, handicapAwayPoints: hcp.awayPoints,
        ouLine: parseFloat(editState.ouLine),
        overOdds: parseFloat(editState.overOdds), underOdds: parseFloat(editState.underOdds),
        overPoints: ou.homePoints, underPoints: ou.awayPoints,
      });
      setEditingId(null); setEditState(null);
      fetchGames();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm("Σίγουρα θέλεις να διαγράψεις αυτό το ματς;")) return;
    try {
      await deleteDoc(doc(db, "matchdays", matchdayId, "games", gameId));
      fetchGames();
    } catch (err) { console.error(err); }
  };

  const handleSetResult = async (game: Game, type: "result" | "handicapResult" | "ouResult", value: string) => {
    if (!confirm("Σίγουρα; Αυτό θα ενημερώσει τους πόντους όλων των παικτών.")) return;
    setGrading(game.id + type);
    try {
      const updateData: any = { [type]: value };
      if (type === "result") updateData.status = "finished";
      await updateDoc(doc(db, "matchdays", matchdayId, "games", game.id), updateData);

      const predictionsSnap = await getDocs(collection(db, "predictions"));
      const batch = writeBatch(db);

      for (const predDoc of predictionsSnap.docs) {
        const predData = predDoc.data();
        if (predData.matchdayId !== matchdayId) continue;

        const pickKey = type === "result" ? game.id : type === "handicapResult" ? game.id + "_hcp" : game.id + "_ou";
        if (!predData.picks || !predData.picks[pickKey]) continue;

        const userPick = predData.picks[pickKey];
        const isCorrect = userPick === value;
        let pointsEarned = -1;

        if (isCorrect) {
          if (type === "result") pointsEarned = value === "home" ? game.homePoints : game.awayPoints;
          else if (type === "handicapResult") pointsEarned = value === "home" ? game.handicapHomePoints : game.handicapAwayPoints;
          else pointsEarned = value === "over" ? game.overPoints : game.underPoints;
        }

        const userRef = doc(db, "users", predData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          batch.update(userRef, { points: (userSnap.data().points || 0) + pointsEarned });
        }
      }
      await batch.commit();
      fetchGames();
    } catch (err) { console.error(err); alert("Κάτι πήγε στραβά."); }
    finally { setGrading(null); }
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("el-GR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const points = homeOdds && awayOdds ? calcPoints(parseFloat(homeOdds), parseFloat(awayOdds)) : null;

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
        <a href="/admin/matchdays" className="text-xs text-gray-500 hover:text-white ml-4">← Πίσω</a>
      </nav>

      <div className="max-w-2xl mx-auto px-10 py-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-medium">Αγωνιστική #{matchday?.number}</h1>
            <p className="text-xs text-gray-500 mt-1">Deadline: {formatDate(matchday?.deadline)}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#ff751f] text-black font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-[#e6671a]">
            + Πρόσθεσε ματς
          </button>
        </div>

        {showForm && (
          <div className="bg-[#111] border border-[#ff751f] rounded-xl p-6 mb-6">
            <h2 className="text-base font-medium mb-4">Νέο ματς</h2>
            <form onSubmit={handleAddGame} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Γηπεδούχος</label>
                  <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]" required>
                    <option value="">Επέλεξε ομάδα...</option>
                    {EUROLEAGUE_TEAMS.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Φιλοξενούμενος</label>
                  <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]" required>
                    <option value="">Επέλεξε ομάδα...</option>
                    {EUROLEAGUE_TEAMS.filter(t => t.name !== homeTeam).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Ημερομηνία και ώρα</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff751f]" required />
              </div>

              {/* 1/2 */}
              <div className="border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-xs text-[#ff751f] font-medium mb-3">1 / 2 — Νικητής</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση {homeTeam || "γηπεδούχου"}</label>
                    <input type="number" step="0.01" value={homeOdds} onChange={(e) => setHomeOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="π.χ. 1.40" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση {awayTeam || "φιλοξενούμενου"}</label>
                    <input type="number" step="0.01" value={awayOdds} onChange={(e) => setAwayOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="π.χ. 3.20" required />
                  </div>
                </div>
                {points && (
                  <div className="mt-2 text-xs text-gray-500">
                    Πόντοι: {homeTeam || "Γηπεδούχος"} <span className="text-[#ff751f]">+{points.homePoints}</span> · {awayTeam || "Φιλοξενούμενος"} <span className="text-[#ff751f]">+{points.awayPoints}</span>
                  </div>
                )}
              </div>

              {/* Handicap */}
              <div className="border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-xs text-[#ff751f] font-medium mb-3">Handicap</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Line (π.χ. -5.5)</label>
                    <input type="number" step="0.5" value={handicapLine} onChange={(e) => setHandicapLine(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="-5.5" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση {homeTeam || "γηπ."}</label>
                    <input type="number" step="0.01" value={handicapHomeOdds} onChange={(e) => setHandicapHomeOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="1.85" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση {awayTeam || "φιλ."}</label>
                    <input type="number" step="0.01" value={handicapAwayOdds} onChange={(e) => setHandicapAwayOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="1.85" required />
                  </div>
                </div>
              </div>

              {/* Over/Under */}
              <div className="border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-xs text-[#ff751f] font-medium mb-3">Over / Under</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Line (π.χ. 160.5)</label>
                    <input type="number" step="0.5" value={ouLine} onChange={(e) => setOuLine(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="160.5" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση Over</label>
                    <input type="number" step="0.01" value={overOdds} onChange={(e) => setOverOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="1.85" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Απόδοση Under</label>
                    <input type="number" step="0.01" value={underOdds} onChange={(e) => setUnderOdds(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff751f]"
                      placeholder="1.85" required />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-[#ff751f] text-black font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-[#e6671a] disabled:opacity-50">
                  {saving ? "Αποθήκευση..." : "Πρόσθεσε"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-[#333] text-gray-400 px-4 py-2.5 rounded-lg text-sm hover:bg-[#1a1a1a]">
                  Ακύρωση
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-gray-400">Ματς ({games.length})</h2>
          {games.length === 0 && (
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-8 text-center text-gray-500 text-sm">
              Δεν υπάρχουν ματς ακόμα.
            </div>
          )}
          {games.map((g) => (
            <div key={g.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl px-6 py-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-white">{g.homeTeam} vs {g.awayTeam}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(g.date)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    g.status === "pending" ? "bg-[#222] text-gray-400" :
                    g.status === "live" ? "bg-[#ff751f] text-black" :
                    "bg-green-900 text-green-400"
                  }`}>
                    {g.status === "pending" ? "Αναμονή" : g.status === "live" ? "LIVE" : "Τελικό"}
                  </span>
                  <button onClick={() => startEdit(g)}
                    className="text-xs border border-[#333] text-gray-400 px-2.5 py-1 rounded-lg hover:border-[#ff751f] hover:text-[#ff751f] transition-colors">
                    Επεξεργασία
                  </button>
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
                  <button onClick={() => handleSetResult(g, "result", "home")} disabled={grading === g.id + "result"}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${g.result === "home" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                    {g.homeTeam}
                  </button>
                  <button onClick={() => handleSetResult(g, "result", "away")} disabled={grading === g.id + "result"}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${g.result === "away" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                    {g.awayTeam}
                  </button>
                </div>
              </div>

              {/* Handicap result */}
              {g.handicapLine !== undefined && (
                <div className="border-t border-[#1a1a1a] pt-3 mb-3">
                  <div className="text-xs text-gray-500 mb-2">
                    Handicap {g.handicapLine > 0 ? "+" : ""}{g.handicapLine} {g.handicapResult ? "→ " + (g.handicapResult === "home" ? g.homeTeam : g.awayTeam) : "(αποτέλεσμα;)"}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSetResult(g, "handicapResult", "home")} disabled={grading === g.id + "handicapResult"}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${g.handicapResult === "home" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      {g.homeTeam} {g.handicapLine > 0 ? "+" : ""}{g.handicapLine}
                    </button>
                    <button onClick={() => handleSetResult(g, "handicapResult", "away")} disabled={grading === g.id + "handicapResult"}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${g.handicapResult === "away" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      {g.awayTeam} {g.handicapLine > 0 ? "-" : "+"}{Math.abs(g.handicapLine)}
                    </button>
                  </div>
                </div>
              )}

              {/* O/U result */}
              {g.ouLine !== undefined && (
                <div className="border-t border-[#1a1a1a] pt-3">
                  <div className="text-xs text-gray-500 mb-2">
                    Over/Under {g.ouLine} {g.ouResult ? "→ " + (g.ouResult === "over" ? "Over" : "Under") : "(αποτέλεσμα;)"}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSetResult(g, "ouResult", "over")} disabled={grading === g.id + "ouResult"}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${g.ouResult === "over" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      Over {g.ouLine}
                    </button>
                    <button onClick={() => handleSetResult(g, "ouResult", "under")} disabled={grading === g.id + "ouResult"}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${g.ouResult === "under" ? "bg-[#ff751f] text-black" : "bg-[#1a1a1a] border border-[#333] text-white hover:border-[#ff751f]"}`}>
                      Under {g.ouLine}
                    </button>
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