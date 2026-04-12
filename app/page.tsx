"use client";

import { useEffect, useState, useRef } from "react";
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

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{x: number; y: number; vx: number; vy: number; size: number; opacity: number; life: number}>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 40; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        life: Math.random(),
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.003;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const pulse = Math.sin(p.life * Math.PI * 2) * 0.15 + 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 117, 31, ${p.opacity * pulse})`;
        ctx.fill();
      });
      particles.current.forEach((p1, i) => {
        particles.current.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 117, 31, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function Basketball() {
  return (
    <div className="absolute right-[5%] md:right-[10%] top-[10%] pointer-events-none hidden md:block">
      <motion.div
        animate={{ y: [0, -30, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff8c3a] to-[#cc5500] shadow-[0_0_40px_rgba(255,117,31,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 rounded-full border-2 border-black/20"></div>
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/20 -translate-y-1/2"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-black/20 -translate-x-1/2"></div>
          <div className="absolute top-[10%] left-[10%] right-[10%] h-[2px] bg-black/15 rounded-full" style={{ transform: "rotate(-15deg)" }}></div>
          <div className="absolute bottom-[10%] left-[10%] right-[10%] h-[2px] bg-black/15 rounded-full" style={{ transform: "rotate(15deg)" }}></div>
          <div className="absolute top-2 left-3 w-4 h-2 bg-white/20 rounded-full blur-sm"></div>
        </div>
      </motion.div>
      <motion.div
        animate={{ scaleX: [1, 0.7, 1], opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-3 bg-[#ff751f] rounded-full blur-md mx-auto mt-2 opacity-30"
      />
    </div>
  );
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

  if (expired) return <span className="text-red-400 text-sm font-bold">Έληξε</span>;

  return (
    <div className="flex items-center gap-1">
      {[
        { val: timeLeft.hours, label: "ΩΡ" },
        { val: timeLeft.minutes, label: "ΛΕΠ" },
        { val: timeLeft.seconds, label: "ΔΕΥ" },
      ].map(({ val, label }, i) => (
        <div key={i} className="flex items-end gap-0.5">
          <div className="bg-[#0f0f0f] border border-[#ff751f]/30 rounded-lg px-2 py-1.5 min-w-[36px] text-center shadow-[0_0_10px_rgba(255,117,31,0.1)]">
            <span className="text-base font-black text-white tabular-nums leading-none block">{String(val).padStart(2, "0")}</span>
            <span className="text-[8px] text-gray-600 tracking-widest">{label}</span>
          </div>
          {i < 2 && <span className="text-[#ff751f] font-black text-lg mb-3">:</span>}
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
      <div className="relative overflow-hidden min-h-[85vh] flex items-center">
        <Particles />
        <Basketball />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#ff751f] opacity-[0.07] blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[400px] bg-[#ff751f] opacity-[0.04] blur-[120px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "linear-gradient(#ff751f 1px, transparent 1px), linear-gradient(90deg, #ff751f 1px, transparent 1px)",
            backgroundSize: "80px 80px"
          }}></div>
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at center, transparent 30%, #080808 80%)"
          }}></div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 relative">
          <div className="flex-1 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 bg-[rgba(255,117,31,0.08)] border border-[rgba(255,117,31,0.2)] rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
              <span className="text-[#ff751f] text-xs tracking-[3px] font-semibold">EUROLEAGUE PREDICTIONS</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
              Πρόβλεψε.<br />
              Ανταγωνίσου.<br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff751f] via-[#ff9a5c] to-[#ff751f] bg-[length:200%_auto] animate-pulse">Κέρδισε.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff751f] to-transparent rounded-full"></span>
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-base md:text-lg leading-relaxed mb-8 max-w-md">
              Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague, μάζεψε πόντους και ανέβα στην παγκόσμια κατάταξη.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-3 mb-12 justify-center md:justify-start">
              <a href="/auth/register" className="bg-[#ff751f] text-black font-black px-8 py-3.5 rounded-xl text-sm hover:bg-[#e6671a] transition-all shadow-[0_0_40px_rgba(255,117,31,0.4)] hover:shadow-[0_0_60px_rgba(255,117,31,0.6)] hover:scale-105 transform">
                Ξεκίνα δωρεάν →
              </a>
              <a href="/rules" className="border border-[#2a2a2a] text-white px-8 py-3.5 rounded-xl text-sm hover:bg-[#111] hover:border-[#ff751f]/50 transition-all">
                Πώς λειτουργεί
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="flex gap-8 justify-center md:justify-start">
              <div className="text-center md:text-left">
                <div className="text-3xl font-black text-white"><AnimatedNumber value={totalUsers} /></div>
                <div className="text-[10px] tracking-[3px] text-gray-600 mt-1 uppercase">Παίκτες</div>
              </div>
              <div className="w-px bg-[#1a1a1a]"></div>
              <div className="text-center md:text-left">
                <div className="text-3xl font-black text-white">{matchday ? "#" + matchday.number : "—"}</div>
                <div className="text-[10px] tracking-[3px] text-gray-600 mt-1 uppercase">Αγωνιστική</div>
              </div>
              <div className="w-px bg-[#1a1a1a]"></div>
              <div className="text-center md:text-left">
                {matchday ? <CountdownTimer deadline={matchday.deadline} /> : <div className="text-3xl font-black text-white">—</div>}
                <div className="text-[10px] tracking-[3px] text-gray-600 mt-1 uppercase">Deadline</div>
              </div>
            </motion.div>
          </div>

          {games.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden md:block flex-shrink-0 w-[320px]">
              <div className="bg-[#0f0f0f] border border-[#ff751f]/20 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,117,31,0.1)]">
                <div className="bg-gradient-to-r from-[#ff751f] to-[#cc5500] px-4 py-3 flex justify-between items-center">
                  <span className="text-black font-black text-xs tracking-widest">LIVE SCOREBOARD</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
                    <span className="text-black text-xs font-bold">AGN #{matchday?.number}</span>
                  </div>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {games.slice(0, 4).map((g, i) => (
                    <motion.div key={g.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{g.homeTeam}</div>
                        <div className="text-[10px] text-gray-600">vs {g.awayTeam}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {predictions[g.id] ? (
                          <span className="text-[10px] bg-[rgba(255,117,31,0.15)] text-[#ff751f] border border-[rgba(255,117,31,0.3)] px-2 py-0.5 rounded-full font-bold">
                            {predictions[g.id] === "home" ? g.homeTeam.substring(0,3) : g.awayTeam.substring(0,3)} ✓
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-600 border border-[#2a2a2a] px-2 py-0.5 rounded-full">—</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-[#1a1a1a] flex justify-between items-center">
                  <span className="text-[10px] text-gray-600">{pickedCount}/{totalPicks} προβλέψεις</span>
                  <div className="w-24 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-1 bg-[#ff751f] rounded-full transition-all" style={{ width: progressPct + "%" }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff751f]/40 to-transparent"></div>
      </div>

      {/* Ticker — animated right to left */}
      {games.length > 0 && (
        <div className="bg-gradient-to-r from-[#cc5500] via-[#ff751f] to-[#cc5500] overflow-hidden">
          <motion.div
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex gap-8 py-2.5 w-max"
          >
            {[...games, ...games, ...games, ...games].map((g, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 px-2">
                <span className="text-[10px] font-black text-black/50">●</span>
                <span className="text-xs font-black text-black">{g.homeTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-[10px] text-black/50 font-bold">vs</span>
                <span className="text-xs font-black text-black">{g.awayTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-[10px] text-black/60 ml-1">{formatGameDate(g.date)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Progress bar */}
      {matchday && games.length > 0 && user && (
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10 pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 font-medium">Προβλέψεις αγωνιστικής</span>
            <span className="text-xs text-[#ff751f] font-black">{pickedCount}/{totalPicks}</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div className="h-1.5 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c] rounded-full shadow-[0_0_8px_rgba(255,117,31,0.5)]"
              initial={{ width: 0 }} animate={{ width: progressPct + "%" }} transition={{ duration: 0.5, ease: "easeOut" }} />
          </div>
        </div>
      )}

      {/* Games section */}
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black">
              {matchday ? "Αγωνιστική #" + matchday.number : "Δεν υπάρχει ανοιχτή αγωνιστική"}
            </h2>
            {matchday && (
              <p className="text-xs text-gray-600 mt-1 hidden md:block">
                Deadline: {matchday.deadline ? (matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline)).toLocaleString("el-GR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            )}
          </div>
          {matchday && (
            <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]"></div>
              <span className="text-xs text-gray-400 font-medium">Ανοιχτή</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] h-48 animate-pulse"></div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-gray-600 text-sm py-20 text-center">
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
                  className={`rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden ${
                    allPicked
                      ? "bg-[#0f0f0f] border-[rgba(255,117,31,0.3)] shadow-[0_0_40px_rgba(255,117,31,0.07)]"
                      : "bg-[#0f0f0f] border-[#1a1a1a] hover:border-[#252525]"
                  }`}
                >
                  {allPicked && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff751f] to-transparent"></div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-[#151515] border border-[#222] px-2.5 py-1 rounded-lg font-medium">{formatGameDate(g.date)}</span>
                      {g.status === "live" && (
                        <span className="text-[10px] bg-[#ff751f] text-black px-2.5 py-1 rounded-lg font-black inline-flex items-center gap-1 shadow-[0_0_15px_rgba(255,117,31,0.6)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse inline-block"></span>
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      {saving === g.id || saving === g.id + "_hcp" || saving === g.id + "_ou" ? (
                        <div className="w-4 h-4 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className={`px-2 py-0.5 rounded-lg font-bold transition-all ${predictions[g.id] ? "text-[#ff751f] bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)]" : "text-gray-700 bg-[#151515] border border-[#222]"}`}>1/2</span>
                          <span className={`px-2 py-0.5 rounded-lg font-bold transition-all ${predictions[g.id + "_hcp"] ? "text-blue-400 bg-[rgba(96,165,250,0.1)] border border-[rgba(96,165,250,0.2)]" : "text-gray-700 bg-[#151515] border border-[#222]"}`}>HCP</span>
                          <span className={`px-2 py-0.5 rounded-lg font-bold transition-all ${predictions[g.id + "_ou"] ? "text-green-400 bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)]" : "text-gray-700 bg-[#151515] border border-[#222]"}`}>O/U</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-5">
                    <span className="text-lg font-black text-white">{g.homeTeam}</span>
                    <span className="text-[10px] text-gray-600 bg-[#151515] border border-[#222] px-2 py-0.5 rounded-full font-bold">VS</span>
                    <span className="text-lg font-black text-white">{g.awayTeam}</span>
                  </div>

                  {/* 1/2 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-[#ff751f] bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] px-2 py-0.5 rounded-full">1/2</span>
                      <span className="text-[10px] text-gray-600">Νικητής αγώνα</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["home", "away"].map(side => (
                        <motion.button key={side} whileTap={{ scale: 0.96 }}
                          onClick={() => handlePick(g.id, side)} disabled={saving === g.id}
                          className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            predictions[g.id] === side
                              ? "bg-gradient-to-b from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
                              : "bg-[#151515] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]"
                          }`}>
                          <span className="text-xs font-bold text-center leading-tight">{side === "home" ? g.homeTeam : g.awayTeam}</span>
                          <span className="text-xs text-[#ff751f] font-black">+{side === "home" ? g.homePoints : g.awayPoints} πτς</span>
                        </motion.button>
                      ))}
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
                          <div className="h-1 bg-[#252525] flex-1"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Handicap */}
                  {g.handicapLine !== undefined && (
                    <div className="mb-4 pt-3 border-t border-[#151515]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-blue-400 bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] px-2 py-0.5 rounded-full">HCP</span>
                        <span className="text-[10px] text-gray-600">Handicap {g.handicapLine > 0 ? "+" : ""}{g.handicapLine}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {["home", "away"].map(side => (
                          <motion.button key={side} whileTap={{ scale: 0.96 }}
                            onClick={() => handlePick(g.id + "_hcp", side)} disabled={saving === g.id + "_hcp"}
                            className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                              predictions[g.id + "_hcp"] === side
                                ? "bg-gradient-to-b from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.2)]"
                                : "bg-[#151515] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]"
                            }`}>
                            <span className="text-xs font-bold">
                              {side === "home" ? g.homeTeam : g.awayTeam}{" "}
                              {side === "home"
                                ? (g.handicapLine > 0 ? "+" : "") + g.handicapLine
                                : (g.handicapLine > 0 ? "-" : "+") + Math.abs(g.handicapLine)}
                            </span>
                            <span className="text-xs text-[#ff751f] font-black">+{side === "home" ? g.handicapHomePoints : g.handicapAwayPoints} πτς</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Over/Under */}
                  {g.ouLine !== undefined && (
                    <div className="pt-3 border-t border-[#151515]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-green-400 bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.2)] px-2 py-0.5 rounded-full">O/U</span>
                        <span className="text-[10px] text-gray-600">Over / Under {g.ouLine}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[["over", "↑"], ["under", "↓"]].map(([side, arrow]) => (
                          <motion.button key={side} whileTap={{ scale: 0.96 }}
                            onClick={() => handlePick(g.id + "_ou", side)} disabled={saving === g.id + "_ou"}
                            className={`rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                              predictions[g.id + "_ou"] === side
                                ? "bg-gradient-to-b from-[rgba(255,117,31,0.2)] to-[rgba(255,117,31,0.05)] border border-[#ff751f] shadow-[0_0_20px_rgba(255,117,31,0.2)]"
                                : "bg-[#151515] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]"
                            }`}>
                            <span className="text-xs font-bold">{side === "over" ? "Over" : "Under"} {g.ouLine} {arrow}</span>
                            <span className="text-xs text-[#ff751f] font-black">+{side === "over" ? g.overPoints : g.underPoints} πτς</span>
                          </motion.button>
                        ))}
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
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 pb-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:border-[#252525] transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-[3px] text-gray-600 font-bold uppercase">Γενική Κατάταξη</span>
            <a href="/leaderboard" className="text-xs text-[#ff751f] hover:underline font-bold">Δες όλους →</a>
          </div>
          {topUsers.length === 0 ? (
            <div className="text-gray-600 text-sm">Κανένας παίκτης ακόμα.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {topUsers.map((u, i) => {
                const isMe = user?.uid === u.id;
                return (
                  <div key={u.id} className={`flex items-center gap-2.5 py-1 px-2 rounded-xl transition-colors ${isMe ? "bg-[rgba(255,117,31,0.06)] border border-[rgba(255,117,31,0.1)]" : "hover:bg-[#151515]"}`}>
                    <span className="text-xs w-5 text-center">{i < 3 ? ["🥇","🥈","🥉"][i] : <span className="text-gray-600 font-bold">{i+1}</span>}</span>
                    <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-xs text-white flex-1 truncate font-medium">
                      {u.username}
                      {isMe && <span className="text-[#ff751f] ml-1 font-bold">(εσύ)</span>}
                    </span>
                    <span className="text-xs text-[#ff751f] font-black">{u.points}</span>
                  </div>
                );
              })}
              {myRank > 5 && user && (
                <div className="border-t border-[#151515] pt-2 mt-1">
                  <div className="flex items-center gap-2.5 bg-[rgba(255,117,31,0.06)] border border-[rgba(255,117,31,0.1)] rounded-xl px-2 py-1.5">
                    <span className="text-xs text-gray-600 w-5 text-center font-bold">{myRank}</span>
                    <div className="w-6 h-6 rounded-full bg-[#ff751f] flex items-center justify-center text-[10px] font-black text-black flex-shrink-0">
                      {user.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-xs text-white flex-1 truncate font-medium">{user.displayName} <span className="text-[#ff751f] font-bold">(εσύ)</span></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:border-[#252525] transition-all">
          <div className="text-[10px] tracking-[3px] text-gray-600 font-bold uppercase mb-4">Η Θέση Μου</div>
          {user ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-white font-black">{user.displayName}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{pickedCount}/{totalPicks} προβλέψεις</div>
                </div>
                {myRank > 0 && (
                  <div className="text-3xl font-black text-[#ff751f] drop-shadow-[0_0_10px_rgba(255,117,31,0.5)]">#{myRank}</div>
                )}
              </div>
              <div className="h-2 bg-[#151515] rounded-full overflow-hidden border border-[#1a1a1a]">
                <motion.div className="h-2 bg-gradient-to-r from-[#ff751f] to-[#ff9a5c] rounded-full"
                  initial={{ width: 0 }} animate={{ width: progressPct + "%" }} transition={{ duration: 0.5 }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-gray-700 font-medium">0</span>
                <span className="text-[10px] text-[#ff751f] font-bold">{Math.round(progressPct)}%</span>
                <span className="text-[10px] text-gray-700 font-medium">{totalPicks}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-gray-600 text-sm mb-4">Συνδέσου για να δεις τη θέση σου.</div>
              <a href="/auth/login" className="text-xs text-[#ff751f] hover:underline font-bold">Σύνδεση →</a>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-5 hover:border-[#252525] transition-all">
          <div className="text-[10px] tracking-[3px] text-gray-600 font-bold uppercase mb-4">Εβδομαδιαίο Challenge</div>
          <div className="bg-gradient-to-br from-[rgba(255,117,31,0.08)] to-transparent border border-[rgba(255,117,31,0.12)] rounded-xl p-4">
            <div className="text-sm font-black text-[#ff751f] mb-2">🏆 Σύντομα!</div>
            <div className="text-xs text-gray-500 leading-relaxed">Εβδομαδιαία challenges με bonus πόντους για τους καλύτερους παίκτες.</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}