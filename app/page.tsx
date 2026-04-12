"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, limit, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getBadge } from "@/lib/badges";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: any;
  homePoints: number;
  awayPoints: number;
  handicapLine: number;
  handicapHomePoints: number;
  handicapAwayPoints: number;
  ouLine: number;
  overPoints: number;
  underPoints: number;
  status: string;
}

interface Matchday {
  id: string;
  number: number;
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

  if (expired) return <span className="text-red-400 text-sm">Έληξε</span>;

  return (
    <div className="flex items-center gap-1">
      {[
        { val: timeLeft.hours, label: "ω" },
        { val: timeLeft.minutes, label: "λ" },
        { val: timeLeft.seconds, label: "δ" },
      ].map(({ val, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 min-w-[34px] text-center shadow-inner">
            <span className="text-sm font-bold text-white tabular-nums">{String(val).padStart(2, "0")}</span>
          </div>
          <span className="text-[10px] text-gray-600 mx-0.5">{label}</span>
          {i < 2 && <span className="text-[#ff751f] font-bold mx-0.5">:</span>}
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

  useEffect(() => { fetchCurrentMatchday(); fetchLeaderboard(); }, []);
  useEffect(() => { if (user && matchday) fetchUserPredictions(matchday.id); }, [user, matchday]);
  useEffect(() => { if (matchday && games.length > 0) fetchGameStats(matchday.id); }, [matchday, games]);

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

  const handlePick = async (gameId: string, pick: string) => {
    if (!user) { router.push("/auth/login"); return; }
    if (!matchday) return;
    const deadline = matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline);
    if (new Date() > deadline) { alert("Το deadline έχει περάσει!"); return; }
    setSaving(gameId);
    const newPredictions = { ...predictions, [gameId]: pick };
    setPredictions(newPredictions);
    try {
      await setDoc(doc(db, "predictions", user.uid + "_" + matchday.id), {
        userId: user.uid, matchdayId: matchday.id, picks: newPredictions, updatedAt: new Date(),
      }, { merge: true });
      await fetchGameStats(matchday.id);
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  const formatGameDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("el-GR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  };

  const totalPicks = games.length * 3;
  const pickedCount = Object.keys(predictions).length;
  const progressPct = totalPicks > 0 ? (pickedCount / totalPicks) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#080808]">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ff751f] opacity-[0.06] blur-[120px] rounded-full"></div>
          <div className="absolute top-[200px] left-[-100px] w-[400px] h-[400px] bg-[#ff751f] opacity-[0.03] blur-[100px] rounded-full"></div>
          <div className="absolute top-[100px] right-[-100px] w-[300px] h-[300px] bg-[#ff751f] opacity-[0.03] blur-[100px] rounded-full"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(#ff751f 1px, transparent 1px), linear-gradient(90deg, #ff751f 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}></div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-28 flex flex-col items-center text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
            <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EUROLEAGUE PREDICTIONS</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold leading-[1.1] mb-6 tracking-tight">
            Πρόβλεψε.<br />Ανταγωνίσου.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff751f] to-[#ff9a5c]">Κέρδισε.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-sm md:text-lg leading-relaxed mb-10 max-w-xl px-4">
            Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague, μάζεψε πόντους και ανέβα στην παγκόσμια κατάταξη.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-3 mb-14 w-full max-w-xs md:max-w-none md:w-auto">
            <a href="/auth/register" className="flex-1 md:flex-none text-center bg-[#ff751f] text-black font-bold px-8 md:px-10 py-3.5 rounded-xl text-sm hover:bg-[#e6671a] transition-all shadow-[0_0_30px_rgba(255,117,31,0.3)] hover:shadow-[0_0_40px_rgba(255,117,31,0.5)] hover:scale-105 transform">
              Ξεκίνα δωρεάν →
            </a>
            <a href="/rules" className="flex-1 md:flex-none text-center border border-[#2a2a2a] text-white px-8 md:px-10 py-3.5 rounded-xl text-sm hover:bg-[#111] hover:border-[#ff751f] transition-all">
              Πώς λειτουργεί
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-0 w-full max-w-sm md:max-w-none justify-center">
            <div className="pr-8 md:pr-12 mr-8 md:mr-12 border-r border-[#1a1a1a] text-center">
              <div className="text-3xl md:text-4xl font-bold text-white"><AnimatedNumber value={totalUsers} /></div>
              <div className="text-[10px] tracking-[3px] text-gray-600 mt-1.5 uppercase">Παίκτες</div>
            </div>
            <div className="pr-8 md:pr-12 mr-8 md:mr-12 border-r border-[#1a1a1a] text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{matchday ? "#" + matchday.number : "—"}</div>
              <div className="text-[10px] tracking-[3px] text-gray-600 mt-1.5 uppercase">Αγωνιστική</div>
            </div>
            <div className="text-center">
              {matchday ? <CountdownTimer deadline={matchday.deadline} /> : <div className="text-3xl md:text-4xl font-bold text-white">—</div>}
              <div className="text-[10px] tracking-[3px] text-gray-600 mt-1.5 uppercase">Deadline</div>
            </div>
          </motion.div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff751f] to-transparent opacity-30"></div>
      </div>

      {/* Ticker */}
      {games.length > 0 && (
        <div className="bg-gradient-to-r from-[#e6671a] via-[#ff751f] to-[#e6671a] overflow-hidden">
          <div className="flex gap-8 px-5 py-2.5 overflow-x-auto scrollbar-none">
            {[...games, ...games].map((g, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                <span className="text-xs font-bold text-black">{g.homeTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-[10px] text-black/50">vs</span>
                <span className="text-xs font-bold text-black">{g.awayTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-xs text-black/60 ml-1">{formatGameDate(g.date)}</span>
                <span className="text-black/20 mx-2">|</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {matchday && games.length > 0 && user && (
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 font-medium">Προβλέψεις αγωνιστικής</span>
            <span className="text-xs text-[#ff751f] font-bold">{pickedCount}/{totalPicks}</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div className="h-1.5 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c] rounded-full shadow-[0_0_8px_rgba(255,117,31,0.5)]"
              initial={{ width: 0 }} animate={{ width: progressPct + "%" }} transition={{ duration: 0.5, ease: "easeOut" }} />
          </div>
        </div>
      )}

      {/* Games section */}
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-8">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold">
              {matchday ? "Αγωνιστική #" + matchday.number : "Δεν υπάρχει ανοιχτή αγωνιστική"}
            </h2>
            {matchday && (
              <p className="text-xs text-gray-600 mt-0.5 hidden md:block">
                Deadline: {matchday.deadline ? (matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline)).toLocaleString("el-GR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            )}
          </div>
          {matchday && (
            <div className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-gray-400">Ανοιχτή</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#111] rounded-2xl border border-[#1e1e1e] h-40 animate-pulse"></div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-gray-500 text-sm py-20 text-center">
            {matchday ? "Δεν υπάρχουν ματς ακόμα." : "Δεν υπάρχει ανοιχτή αγωνιστική αυτή τη στιγμή."}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {games.map((g, index) => {
              const stats = gameStats[g.id];
              const allPicked = predictions[g.id] && predictions[g.id + "_hcp"] && predictions[g.id + "_ou"];
              return (
                <motion.div key={g.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className={`rounded-2xl border p-5 transition-all duration-300 ${
                    allPicked
                      ? "bg-[rgba(255,117,31,0.04)] border-[rgba(255,117,31,0.2)] shadow-[0_0_30px_rgba(255,117,31,0.05)]"
                      : "bg-[#0f0f0f] border-[#1a1a1a] hover:border-[#2a2a2a]"
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">{formatGameDate(g.date)}</span>
                      {g.status === "live" && (
                        <span className="text-[10px] bg-[#ff751f] text-black px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 shadow-[0_0_10px_rgba(255,117,31,0.5)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse inline-block"></span>
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {saving === g.id || saving === g.id + "_hcp" || saving === g.id + "_ou" ? (
                        <div className="w-4 h-4 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${predictions[g.id] ? "text-[#ff751f] bg-[rgba(255,117,31,0.1)]" : "text-gray-700 bg-[#1a1a1a]"}`}>1/2</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${predictions[g.id + "_hcp"] ? "text-[#ff751f] bg-[rgba(255,117,31,0.1)]" : "text-gray-700 bg-[#1a1a1a]"}`}>HCP</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${predictions[g.id + "_ou"] ? "text-[#ff751f] bg-[rgba(255,117,31,0.1)]" : "text-gray-700 bg-[#1a1a1a]"}`}>O/U</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-center gap-3 mb-5">
                    <span className="text-base font-bold text-white">{g.homeTeam}</span>
                    <span className="text-xs text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-full">vs</span>
                    <span className="text-base font-bold text-white">{g.awayTeam}</span>
                  </div>

                  {/* 1/2 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-[#ff751f] bg-[rgba(255,117,31,0.1)] px-2 py-0.5 rounded-full">1/2</span>
                      <span className="text-[10px] text-gray-600">Νικητής αγώνα</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => handlePick(g.id, "home")} disabled={saving === g.id}
                        className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          predictions[g.id] === "home"
                            ? "bg-gradient-to-br from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.15)]"
                            : "bg-[#151515] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]"
                        }`}>
                        <span className="text-xs font-semibold text-center leading-tight">{g.homeTeam}</span>
                        <span className="text-xs text-[#ff751f] font-bold">+{g.homePoints} πτς</span>
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => handlePick(g.id, "away")} disabled={saving === g.id}
                        className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          predictions[g.id] === "away"
                            ? "bg-gradient-to-br from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.15)]"
                            : "bg-[#151515] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]"
                        }`}>
                        <span className="text-xs font-semibold text-center leading-tight">{g.awayTeam}</span>
                        <span className="text-xs text-[#ff751f] font-bold">+{g.awayPoints} πτς</span>
                      </motion.button>
                    </div>
                    {stats && stats.total > 0 && (
                      <div className="mt-2.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-600 font-medium">{stats.homePct}%</span>
                          <span className="text-[10px] text-gray-700">{stats.total} επιλογές</span>
                          <span className="text-[10px] text-gray-600 font-medium">{stats.awayPct}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-[#1a1a1a] flex">
                          <motion.div className="h-1 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c]"
                            initial={{ width: 0 }} animate={{ width: stats.homePct + "%" }} transition={{ duration: 0.6 }} />
                          <div className="h-1 bg-[#2a2a2a] flex-1"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Handicap */}
                  {g.handicapLine !== undefined && (
                    <div className="mb-4 pt-3 border-t border-[#1a1a1a]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-blue-400 bg-[rgba(96,165,250,0.1)] px-2 py-0.5 rounded-full">HCP</span>
                        <span className="text-[10px] text-gray-600">Handicap {g.handicapLine > 0 ? "+" : ""}{g.handicapLine}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={() => handlePick(g.id + "_hcp", "home")} disabled={saving === g.id + "_hcp"}
                          className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            predictions[g.id + "_hcp"] === "home"
                              ? "bg-gradient-to-br from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.15)]"
                              : "bg-[#151515] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]"
                          }`}>
                          <span className="text-xs font-semibold">{g.homeTeam} {g.handicapLine > 0 ? "+" : ""}{g.handicapLine}</span>
                          <span className="text-xs text-[#ff751f] font-bold">+{g.handicapHomePoints} πτς</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={() => handlePick(g.id + "_hcp", "away")} disabled={saving === g.id + "_hcp"}
                          className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            predictions[g.id + "_hcp"] === "away"
                              ? "bg-gradient-to-br from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.15)]"
                              : "bg-[#151515] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]"
                          }`}>
                          <span className="text-xs font-semibold">{g.awayTeam} {g.handicapLine > 0 ? "-" : "+"}{Math.abs(g.handicapLine)}</span>
                          <span className="text-xs text-[#ff751f] font-bold">+{g.handicapAwayPoints} πτς</span>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* Over/Under */}
                  {g.ouLine !== undefined && (
                    <div className="pt-3 border-t border-[#1a1a1a]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-green-400 bg-[rgba(74,222,128,0.1)] px-2 py-0.5 rounded-full">O/U</span>
                        <span className="text-[10px] text-gray-600">Over / Under {g.ouLine}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={() => handlePick(g.id + "_ou", "over")} disabled={saving === g.id + "_ou"}
                          className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            predictions[g.id + "_ou"] === "over"
                              ? "bg-gradient-to-br from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.15)]"
                              : "bg-[#151515] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]"
                          }`}>
                          <span className="text-xs font-semibold">Over {g.ouLine} ↑</span>
                          <span className="text-xs text-[#ff751f] font-bold">+{g.overPoints} πτς</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={() => handlePick(g.id + "_ou", "under")} disabled={saving === g.id + "_ou"}
                          className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            predictions[g.id + "_ou"] === "under"
                              ? "bg-gradient-to-br from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.15)]"
                              : "bg-[#151515] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]"
                          }`}>
                          <span className="text-xs font-semibold">Under {g.ouLine} ↓</span>
                          <span className="text-xs text-[#ff751f] font-bold">+{g.underPoints} πτς</span>
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom widgets */}
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 pb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:border-[#2a2a2a] transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-[3px] text-gray-600 font-medium uppercase">Γενική Κατάταξη</span>
            <a href="/leaderboard" className="text-xs text-[#ff751f] hover:underline font-medium">Δες όλους →</a>
          </div>
          {topUsers.length === 0 ? (
            <div className="text-gray-600 text-sm">Κανένας παίκτης ακόμα.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {topUsers.map((u, i) => {
                const isMe = user?.uid === u.id;
                return (
                  <div key={u.id} className={`flex items-center gap-2.5 py-1 ${isMe ? "bg-[rgba(255,117,31,0.05)] rounded-lg px-2 -mx-2" : ""}`}>
                    <span className="text-xs w-5 text-center">{i < 3 ? ["🥇","🥈","🥉"][i] : <span className="text-gray-600">{i+1}</span>}</span>
                    <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-xs text-white flex-1 truncate font-medium">
                      {u.username}
                      {isMe && <span className="text-[#ff751f] ml-1">(εσύ)</span>}
                    </span>
                    <span className="text-xs text-[#ff751f] font-bold">{u.points}</span>
                  </div>
                );
              })}
              {myRank > 5 && user && (
                <div className="border-t border-[#1a1a1a] pt-2 mt-1">
                  <div className="flex items-center gap-2.5 bg-[rgba(255,117,31,0.05)] rounded-lg px-2 py-1">
                    <span className="text-xs text-gray-600 w-5 text-center">{myRank}</span>
                    <div className="w-6 h-6 rounded-full bg-[#ff751f] flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
                      {user.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-xs text-white flex-1 truncate">{user.displayName} <span className="text-[#ff751f]">(εσύ)</span></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:border-[#2a2a2a] transition-all">
          <div className="text-[10px] tracking-[3px] text-gray-600 font-medium uppercase mb-4">Η Θέση Μου</div>
          {user ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-white font-bold">{user.displayName}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{pickedCount}/{totalPicks} προβλέψεις</div>
                </div>
                {myRank > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#ff751f]">#{myRank}</div>
                  </div>
                )}
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div className="h-1.5 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c] rounded-full"
                  initial={{ width: 0 }} animate={{ width: progressPct + "%" }} transition={{ duration: 0.5 }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-700">0</span>
                <span className="text-[10px] text-gray-700">{totalPicks}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-gray-600 text-sm mb-4">Συνδέσου για να δεις τη θέση σου.</div>
              <a href="/auth/login" className="text-xs text-[#ff751f] hover:underline font-medium">Σύνδεση →</a>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:border-[#2a2a2a] transition-all">
          <div className="text-[10px] tracking-[3px] text-gray-600 font-medium uppercase mb-4">Εβδομαδιαίο Challenge</div>
          <div className="bg-gradient-to-br from-[rgba(255,117,31,0.08)] to-[rgba(255,117,31,0.02)] border border-[rgba(255,117,31,0.15)] rounded-xl p-4">
            <div className="text-sm font-bold text-[#ff751f] mb-1.5">🏆 Σύντομα!</div>
            <div className="text-xs text-gray-500 leading-relaxed">Εβδομαδιαία challenges με bonus πόντους για τους καλύτερους παίκτες.</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}