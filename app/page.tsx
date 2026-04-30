"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, orderBy, query, limit, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

interface Matchday {
  id: string;
  number: number;
  name?: string;
  deadline: any;
  status: string;
}

interface GameStats {
  homePct: number;
  awayPct: number;
  total: number;
}

interface TopUser {
  id: string;
  username: string;
  points: number;
}

function CountdownTimer({ deadline }: { deadline: any }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const target = deadline.toDate ? deadline.toDate() : new Date(deadline);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (expired) return <span className="text-red-500 font-black text-sm">ΕΛΗΞΕ</span>;

  return (
    <div className="flex items-center gap-2">
      {[
        { val: timeLeft.hours, label: "ΩΡ" },
        { val: timeLeft.minutes, label: "ΛΕΠ" },
        { val: timeLeft.seconds, label: "ΔΕΥ" },
      ].map(({ val, label }, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="bg-[#ff751f] text-black font-black text-xl w-12 h-12 flex items-center justify-center" style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(val).padStart(2, "0")}
          </div>
          {i < 2 && <span className="text-[#ff751f] font-black text-xl">:</span>}
        </div>
      ))}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const increment = end / (1000 / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [matchday, setMatchday] = useState<Matchday | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [gameStats, setGameStats] = useState<Record<string, GameStats>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [myRank, setMyRank] = useState<number>(0);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<{text: string; bonus: number} | null>(null);

  useEffect(() => { fetchCurrentMatchday(); fetchLeaderboard(); fetchChallenge(); }, []);
  useEffect(() => { if (user && matchday) fetchUserPredictions(matchday.id); }, [user, matchday]);
  useEffect(() => { if (matchday && games.length > 0) fetchGameStats(matchday.id); }, [matchday, games]);

  const fetchChallenge = async () => {
    try {
      const snap = await getDoc(doc(db, "config", "weeklyChallenge"));
      if (snap.exists()) setChallenge(snap.data() as {text: string; bonus: number});
    } catch (err) { console.error(err); }
  };

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TopUser));
      setTotalUsers(all.length);
      setTopUsers(all.slice(0, 5));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user && topUsers.length > 0) {
      const fetchRank = async () => {
        const q = query(collection(db, "users"), orderBy("points", "desc"));
        const snapshot = await getDocs(q);
        setMyRank(snapshot.docs.map(d => d.id).indexOf(user.uid) + 1);
      };
      fetchRank();
    }
  }, [user, topUsers]);

  const fetchCurrentMatchday = async () => {
    try {
      const q = query(collection(db, "matchdays"), orderBy("number", "desc"), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        const data = { id: d.id, ...d.data() } as Matchday;
        if (data.status === "open") { setMatchday(data); fetchGames(d.id); }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchGames = async (matchdayId: string) => {
    const q = query(collection(db, "matchdays", matchdayId, "games"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    setGames(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game)));
  };

  const fetchUserPredictions = async (matchdayId: string) => {
    if (!user) return;
    const docSnap = await getDoc(doc(db, "predictions", user.uid + "_" + matchdayId));
    if (docSnap.exists()) setPredictions(docSnap.data().picks || {});
  };

  const fetchGameStats = async (matchdayId: string) => {
    try {
      const predictionsSnap = await getDocs(query(collection(db, "predictions")));
      const counts: Record<string, { home: number; away: number }> = {};
      for (const predDoc of predictionsSnap.docs) {
        const data = predDoc.data();
        if (data.matchdayId !== matchdayId) continue;
        const picks = data.picks || {};
        for (const [gameId, pick] of Object.entries(picks)) {
          if (gameId.includes("_hcp") || gameId.includes("_ou")) continue;
          if (!counts[gameId]) counts[gameId] = { home: 0, away: 0 };
          if (pick === "home") counts[gameId].home++;
          else if (pick === "away") counts[gameId].away++;
        }
      }
      const stats: Record<string, GameStats> = {};
      for (const [gameId, { home, away }] of Object.entries(counts)) {
        const total = home + away;
        stats[gameId] = {
          homePct: total > 0 ? Math.round((home / total) * 100) : 50,
          awayPct: total > 0 ? Math.round((away / total) * 100) : 50,
          total,
        };
      }
      setGameStats(stats);
    } catch (err) { console.error(err); }
  };

  const handlePick = async (pickKey: string, pick: string) => {
    if (!user) { router.push("/auth/login"); return; }
    if (!matchday) return;
    const deadline = matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline);
    if (new Date() > deadline) { alert("Το deadline έχει περάσει!"); return; }
    setSaving(pickKey);
    const newPredictions = { ...predictions };
    if (newPredictions[pickKey] === pick) delete newPredictions[pickKey];
    else newPredictions[pickKey] = pick;
    setPredictions(newPredictions);
    try {
      await setDoc(doc(db, "predictions", user.uid + "_" + matchday.id), {
        userId: user.uid, matchdayId: matchday.id, picks: newPredictions, updatedAt: new Date(),
      });
      await fetchGameStats(matchday.id);
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  const handleHCPPick = async (gameId: string, lineIndex: number) => {
    if (!user) { router.push("/auth/login"); return; }
    if (!matchday) return;
    const deadline = matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline);
    if (new Date() > deadline) { alert("Το deadline έχει περάσει!"); return; }
    const pickKey = `${gameId}_hcp_${lineIndex}`;
    setSaving(pickKey);
    const newPredictions = { ...predictions };
    Object.keys(newPredictions).forEach(k => { if (k.startsWith(`${gameId}_hcp_`)) delete newPredictions[k]; });
    if (!predictions[pickKey]) newPredictions[pickKey] = "selected";
    setPredictions(newPredictions);
    try {
      await setDoc(doc(db, "predictions", user.uid + "_" + matchday.id), {
        userId: user.uid, matchdayId: matchday.id, picks: newPredictions, updatedAt: new Date(),
      });
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  const handleOUPick = async (gameId: string, lineIndex: number) => {
    if (!user) { router.push("/auth/login"); return; }
    if (!matchday) return;
    const deadline = matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline);
    if (new Date() > deadline) { alert("Το deadline έχει περάσει!"); return; }
    const pickKey = `${gameId}_ou_${lineIndex}`;
    setSaving(pickKey);
    const newPredictions = { ...predictions };
    Object.keys(newPredictions).forEach(k => { if (k.startsWith(`${gameId}_ou_`)) delete newPredictions[k]; });
    if (!predictions[pickKey]) newPredictions[pickKey] = "selected";
    setPredictions(newPredictions);
    try {
      await setDoc(doc(db, "predictions", user.uid + "_" + matchday.id), {
        userId: user.uid, matchdayId: matchday.id, picks: newPredictions, updatedAt: new Date(),
      });
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  const formatGameDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("el-GR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  };

  const totalPicks = games.length + games.filter(g => g.handicapLines?.length > 0).length + games.filter(g => g.ouLines?.length > 0).length;
  const pickedCount = Object.keys(predictions).length;
  const progressPct = totalPicks > 0 ? (pickedCount / totalPicks) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden" style={{ fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
      <Navbar />

      {/* HERO — 90s basketball */}
      <div className="relative overflow-hidden bg-[#0a0a0a]">

        {/* Court lines background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-white"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white"></div>
          {/* Half court line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white"></div>
          {/* Three point arc left */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-80 h-96 rounded-full border-4 border-white" style={{ clipPath: "inset(0 0 0 50%)" }}></div>
          {/* Three point arc right */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-80 h-96 rounded-full border-4 border-white" style={{ clipPath: "inset(0 50% 0 0)" }}></div>
        </div>

        {/* Big orange diagonal block */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#ff751f] opacity-[0.06]" style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)" }}></div>

        <div className="relative w-full max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16">

            {/* Left — big type */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Overline */}
                <div className="flex items-center gap-0 mb-4">
                  <div className="bg-[#ff751f] px-3 py-1">
                    <span className="text-black text-[10px] font-black tracking-[4px] uppercase">Euroleague</span>
                  </div>
                  <div className="bg-white px-3 py-1">
                    <span className="text-black text-[10px] font-black tracking-[4px] uppercase">Predictions</span>
                  </div>
                </div>

                {/* Main title */}
                <div className="mb-2">
                  <h1 className="text-[80px] md:text-[120px] font-black leading-[0.85] tracking-tighter uppercase text-white">
                    COURT
                  </h1>
                  <h1 className="text-[80px] md:text-[120px] font-black leading-[0.85] tracking-tighter uppercase text-[#ff751f]"
                    style={{ WebkitTextStroke: "0px", textShadow: "4px 4px 0px rgba(0,0,0,0.5)" }}>
                    PROPHET
                  </h1>
                </div>

                {/* Tagline */}
                <div className="border-l-4 border-[#ff751f] pl-4 mt-6 mb-8">
                  <p className="text-gray-400 text-sm font-bold leading-relaxed uppercase tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
                    Κάνε τις προβλέψεις σου.<br />
                    Ανέβα στην κατάταξη.<br />
                    Αποδείξου ο καλύτερος.
                  </p>
                </div>

                {!user && (
                  <div className="flex gap-0">
                    <a href="/auth/register"
                      className="bg-[#ff751f] text-black font-black px-8 py-4 text-sm uppercase tracking-widest hover:bg-white transition-colors">
                      Ξεκίνα τώρα
                    </a>
                    <a href="/rules"
                      className="border-2 border-white text-white font-black px-8 py-4 text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                      Κανόνες
                    </a>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right — stats scoreboard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:w-80"
            >
              <div className="border-2 border-white/20 bg-black">
                {/* Scoreboard header */}
                <div className="bg-[#ff751f] px-4 py-2 flex items-center justify-between">
                  <span className="text-black text-xs font-black tracking-widest uppercase">Live Scoreboard</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
                    <span className="text-black text-[10px] font-black">LIVE</span>
                  </div>
                </div>

                {/* Stats */}
<div className="divide-y divide-white/10">
  <div className="p-4">
    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Αγωνιστική</div>
    <div className="text-2xl font-black text-[#ff751f] truncate">
      {matchday ? (matchday.name || `#${matchday.number}`) : "—"}
    </div>
  </div>
  <div className="p-4">
    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2" style={{ fontFamily: "Arial, sans-serif" }}>Deadline</div>
    {matchday ? <CountdownTimer deadline={matchday.deadline} /> : <span className="text-2xl font-black text-white">—</span>}
  </div>
</div>

                {/* Progress */}
                {user && matchday && (
                  <div className="border-t border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>Προβλέψεις</span>
                      <span className="text-xs font-black text-[#ff751f]">{pickedCount}/{totalPicks}</span>
                    </div>
                    <div className="h-2 bg-white/10 w-full">
                      <motion.div className="h-full bg-[#ff751f]"
                        initial={{ width: 0 }} animate={{ width: progressPct + "%" }} transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom stripe */}
        <div className="h-2 bg-[#ff751f]"></div>
      </div>

      {/* Ticker */}
      {games.length > 0 && (
        <div className="bg-black border-b-2 border-[#ff751f] overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-none">
            {[...games, ...games].map((g, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-2.5 border-r border-white/10 flex-shrink-0">
                <span className="text-[10px] font-black text-white">{g.homeTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-[#ff751f] font-black text-xs">×</span>
                <span className="text-[10px] font-black text-white">{g.awayTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-[9px] text-gray-600 uppercase" style={{ fontFamily: "Arial, sans-serif" }}>{formatGameDate(g.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Games */}
          <div className="flex-1 min-w-0">

            {/* Section header */}
            <div className="flex items-center gap-0 mb-6">
              <div className="bg-[#ff751f] px-4 py-2">
                <span className="text-black text-xs font-black uppercase tracking-widest">
                  {matchday ? (matchday.name || `Αγωνιστική #${matchday.number}`) : "Προβλέψεις"}
                </span>
              </div>
              {matchday && (
                <div className="bg-white/10 px-4 py-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs font-black text-white uppercase tracking-widest">Ανοιχτή</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-24 bg-white/[0.02] border-2 border-white/[0.06] animate-pulse"></div>
                ))}
              </div>
            ) : games.length === 0 ? (
              <div className="text-gray-600 text-sm py-16 text-center border-2 border-white/[0.06]">
                Δεν υπάρχουν ματς.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {games.map((g, index) => {
                  const stats = gameStats[g.id];
                  const hasHCP = g.handicapLines?.length > 0;
                  const hasOU = g.ouLines?.length > 0;
                  const pickedHCP = hasHCP && Object.keys(predictions).some(k => k.startsWith(`${g.id}_hcp_`));
                  const pickedOU = hasOU && Object.keys(predictions).some(k => k.startsWith(`${g.id}_ou_`));
                  const picked12 = !!predictions[g.id];
                  const allDone = picked12 && (!hasHCP || pickedHCP) && (!hasOU || pickedOU);
                  const isExpanded = expandedGame === g.id;

                  return (
                    <motion.div key={g.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`border-2 overflow-hidden transition-all ${
                        allDone ? "border-[#ff751f] bg-[#ff751f]/5" : "border-white/10 bg-black hover:border-white/30"
                      }`}
                    >
                      {/* Game header stripe */}
                      {allDone && <div className="h-1 bg-[#ff751f]"></div>}

                      <div className="p-4 md:p-5">
                        {/* Meta */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                              {formatGameDate(g.date)}
                            </span>
                            {g.status === "live" && (
                              <div className="bg-red-600 px-2 py-0.5 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                <span className="text-[9px] text-white font-black uppercase">Live</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[
                              { label: "1/2", active: picked12 },
                              ...(hasHCP ? [{ label: "HCP", active: pickedHCP }] : []),
                              ...(hasOU ? [{ label: "O/U", active: pickedOU }] : []),
                            ].map(b => (
                              <span key={b.label} className={`text-[9px] px-2 py-0.5 font-black uppercase tracking-wider border ${
                                b.active
                                  ? "bg-[#ff751f] border-[#ff751f] text-black"
                                  : "border-white/20 text-gray-600"
                              }`}>{b.label}</span>
                            ))}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="flex items-stretch gap-0 mb-4">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePick(g.id, "home")}
                            disabled={!!saving}
                            className={`flex-1 flex items-center justify-between px-4 py-4 border-2 transition-all ${
                              predictions[g.id] === "home"
                                ? "bg-[#ff751f] border-[#ff751f] text-black"
                                : "bg-transparent border-white/10 text-white hover:border-[#ff751f]/50 hover:bg-[#ff751f]/5"
                            }`}>
                            <span className="text-sm font-black uppercase truncate">{g.homeTeam}</span>
                            <span className={`text-xs font-black ml-2 flex-shrink-0 ${predictions[g.id] === "home" ? "text-black" : "text-[#ff751f]"}`}>+{g.homePoints}</span>
                          </motion.button>

                          <div className="flex items-center justify-center w-10 bg-white/5 border-y-2 border-white/10 flex-shrink-0">
                            <span className="text-[10px] font-black text-gray-600 uppercase">vs</span>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePick(g.id, "away")}
                            disabled={!!saving}
                            className={`flex-1 flex items-center justify-between px-4 py-4 border-2 transition-all ${
                              predictions[g.id] === "away"
                                ? "bg-[#ff751f] border-[#ff751f] text-black"
                                : "bg-transparent border-white/10 text-white hover:border-[#ff751f]/50 hover:bg-[#ff751f]/5"
                            }`}>
                            <span className={`text-xs font-black mr-2 flex-shrink-0 ${predictions[g.id] === "away" ? "text-black" : "text-[#ff751f]"}`}>+{g.awayPoints}</span>
                            <span className="text-sm font-black uppercase truncate text-right">{g.awayTeam}</span>
                          </motion.button>
                        </div>

                        {/* Stats bar */}
                        {stats && stats.total > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[9px] font-black text-gray-600 w-8 text-right tabular-nums">{stats.homePct}%</span>
                            <div className="flex-1 h-1 bg-white/10 flex overflow-hidden">
                              <motion.div className="h-full bg-[#ff751f]"
                                initial={{ width: 0 }} animate={{ width: stats.homePct + "%" }} transition={{ duration: 0.8 }} />
                            </div>
                            <span className="text-[9px] font-black text-gray-600 w-8 tabular-nums">{stats.awayPct}%</span>
                          </div>
                        )}

                        {/* Expand */}
                        {(hasHCP || hasOU) && (
                          <button
                            onClick={() => setExpandedGame(isExpanded ? null : g.id)}
                            className={`w-full py-2 text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                              isExpanded
                                ? "border-[#ff751f] text-[#ff751f] bg-[#ff751f]/10"
                                : "border-white/10 text-gray-600 hover:border-[#ff751f]/50 hover:text-[#ff751f]"
                            }`}>
                            {isExpanded ? "▲ Κλείσιμο" : "▼ HCP & O/U"}
                            {(pickedHCP || pickedOU) && !isExpanded && (
                              <span className="bg-[#ff751f] text-black text-[8px] w-4 h-4 flex items-center justify-center font-black">
                                {(pickedHCP ? 1 : 0) + (pickedOU ? 1 : 0)}
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expanded */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden border-t-2 border-white/10"
                          >
                            <div className="p-4 md:p-5 flex flex-col gap-5 bg-white/[0.02]">
                              {hasHCP && (
                                <div>
                                  <div className="flex items-center gap-0 mb-3">
                                    <div className="bg-white px-3 py-1">
                                      <span className="text-black text-[9px] font-black uppercase tracking-widest">Handicap</span>
                                    </div>
                                    <div className="bg-white/10 px-3 py-1">
                                      <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Επέλεξε 1</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {g.handicapLines.map((l, i) => {
                                      const pickKey = `${g.id}_hcp_${i}`;
                                      const isSelected = !!predictions[pickKey];
                                      const teamName = l.team === "home" ? g.homeTeam : g.awayTeam;
                                      return (
                                        <motion.button key={i} whileTap={{ scale: 0.99 }}
                                          onClick={() => handleHCPPick(g.id, i)}
                                          className={`flex items-center justify-between px-4 py-3 border-2 text-sm transition-all ${
                                            isSelected
                                              ? "bg-white text-black border-white"
                                              : "bg-transparent border-white/10 text-white hover:border-white/40"
                                          }`}>
                                          <span className="font-black uppercase">{teamName} <span className="text-[#ff751f]">{l.line > 0 ? "+" : ""}{l.line}</span></span>
                                          <span className={`text-xs font-black ${isSelected ? "text-black" : "text-[#ff751f]"}`}>+{l.points} πτς</span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {hasOU && (
                                <div>
                                  <div className="flex items-center gap-0 mb-3">
                                    <div className="bg-[#ff751f] px-3 py-1">
                                      <span className="text-black text-[9px] font-black uppercase tracking-widest">Over / Under</span>
                                    </div>
                                    <div className="bg-white/10 px-3 py-1">
                                      <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Επέλεξε 1</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {g.ouLines.map((l, i) => {
                                      const pickKey = `${g.id}_ou_${i}`;
                                      const isSelected = !!predictions[pickKey];
                                      return (
                                        <motion.button key={i} whileTap={{ scale: 0.99 }}
                                          onClick={() => handleOUPick(g.id, i)}
                                          className={`flex items-center justify-between px-4 py-3 border-2 text-sm transition-all ${
                                            isSelected
                                              ? "bg-[#ff751f] text-black border-[#ff751f]"
                                              : "bg-transparent border-white/10 text-white hover:border-[#ff751f]/50"
                                          }`}>
                                          <span className="font-black uppercase">{l.type === "over" ? "Over" : "Under"} <span className={isSelected ? "text-black" : "text-[#ff751f]"}>{l.line}</span></span>
                                          <span className={`text-xs font-black ${isSelected ? "text-black" : "text-[#ff751f]"}`}>+{l.points} πτς</span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 xl:w-72 flex flex-col gap-4">

            {/* Leaderboard */}
            <div className="border-2 border-white/10 bg-black">
              <div className="bg-white px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-black text-xs font-black uppercase tracking-widest">Κατάταξη</span>
                  <a href="/leaderboard" className="text-[10px] text-black font-black uppercase tracking-widest hover:text-[#ff751f] transition-colors">Όλοι →</a>
                </div>
              </div>
              <div className="p-3">
                {topUsers.length === 0 ? (
                  <div className="text-gray-600 text-xs py-4 text-center uppercase font-bold">Κανένας παίκτης ακόμα</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {topUsers.map((u, i) => {
                      const isMe = user?.uid === u.id;
                      return (
                        <div key={u.id} className={`flex items-center gap-3 p-2 transition-all ${isMe ? "bg-[#ff751f]" : "hover:bg-white/5"}`}>
                          <span className={`text-xs font-black w-6 text-center ${isMe ? "text-black" : "text-gray-600"}`}>
                            {i === 0 ? "01" : i === 1 ? "02" : i === 2 ? "03" : `0${i+1}`}
                          </span>
                          <div className={`w-7 h-7 flex items-center justify-center text-[10px] font-black flex-shrink-0 ${isMe ? "bg-black text-[#ff751f]" : "bg-white/10 text-white"}`}>
                            {u.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className={`text-xs flex-1 truncate font-black uppercase ${isMe ? "text-black" : "text-white"}`}>
                            {u.username}
                          </span>
                          <span className={`text-xs font-black tabular-nums ${isMe ? "text-black" : "text-[#ff751f]"}`}>{u.points}</span>
                        </div>
                      );
                    })}
                    {myRank > 5 && user && (
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <div className="flex items-center gap-3 p-2 bg-[#ff751f]">
                          <span className="text-xs font-black w-6 text-center text-black">{myRank}</span>
                          <div className="w-7 h-7 bg-black flex items-center justify-center text-[10px] font-black text-[#ff751f]">
                            {user.displayName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs flex-1 truncate font-black uppercase text-black">{user.displayName}</span>
                          <span className="text-[9px] font-black text-black uppercase">εσύ</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* My stats */}
            {user ? (
              <div className="border-2 border-white/10 bg-black">
                <div className="bg-[#ff751f] px-4 py-2">
                  <span className="text-black text-xs font-black uppercase tracking-widest">Η Θέση Μου</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-black uppercase text-white">{user.displayName}</div>
                      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>
                        {pickedCount}/{totalPicks} picks
                      </div>
                    </div>
                    {myRank > 0 && (
                      <div className="text-right">
                        <div className="text-4xl font-black text-[#ff751f] tabular-nums leading-none">#{myRank}</div>
                      </div>
                    )}
                  </div>
                  <div className="h-2 bg-white/10 w-full">
                    <motion.div className="h-full bg-[#ff751f]"
                      initial={{ width: 0 }} animate={{ width: progressPct + "%" }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-white/10 bg-black p-4">
                <p className="text-xs text-gray-500 mb-4 uppercase font-bold tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
                  Συνδέσου για να παρακολουθείς τη θέση σου.
                </p>
                <div className="flex gap-0">
                  <a href="/auth/login" className="flex-1 text-center py-2.5 text-xs border-2 border-white/20 text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                    Σύνδεση
                  </a>
                  <a href="/auth/register" className="flex-1 text-center py-2.5 text-xs bg-[#ff751f] text-black font-black uppercase tracking-widest hover:bg-white transition-all">
                    Εγγραφή
                  </a>
                </div>
              </div>
            )}

            {/* Challenge */}
            {challenge && challenge.text && (
              <div className="border-2 border-[#ff751f] bg-black">
                <div className="bg-[#ff751f] px-4 py-2 flex items-center justify-between">
                  <span className="text-black text-xs font-black uppercase tracking-widest">🏆 Challenge</span>
                  <span className="text-black text-xs font-black">+{challenge.bonus} πτς</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>{challenge.text}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}