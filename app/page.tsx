"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, orderBy, query, limit, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: any;
  homePoints: number;
  awayPoints: number;
  status: string;
}

interface Matchday {
  id: string;
  number: number;
  deadline: any;
  status: string;
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
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1 min-w-[36px] text-center">
            <span className="text-sm font-medium text-white tabular-nums">{String(val).padStart(2, "0")}</span>
          </div>
          <span className="text-xs text-gray-600">{label}</span>
          {i < 2 && <span className="text-gray-600 mx-0.5">:</span>}
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
    const duration = 1000;
    const increment = end / (duration / 16);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchCurrentMatchday();
    fetchTotalUsers();
  }, []);

  useEffect(() => {
    if (user && matchday) fetchUserPredictions(matchday.id);
  }, [user, matchday]);

  const fetchTotalUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    setTotalUsers(snapshot.size);
  };

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
        userId: user.uid,
        matchdayId: matchday.id,
        picks: newPredictions,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  const formatGameDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("el-GR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  };

  const pickedCount = Object.keys(predictions).length;
  const progressPct = games.length > 0 ? (pickedCount / games.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <div className="bg-black border-b border-[#1a1a1a] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ff751f] opacity-[0.03] blur-[100px] rounded-full"></div>
        </div>
        <div className="w-full max-w-7xl mx-auto px-10 py-20 flex flex-col items-center text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f] animate-pulse"></div>
            <span className="text-[#ff751f] text-xs tracking-[3px]">EUROLEAGUE PREDICTIONS</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-7xl font-medium leading-tight mb-6"
          >
            Πρόβλεψε.<br />Ανταγωνίσου.<br /><span className="text-[#ff751f]">Κέρδισε.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-500 text-base leading-relaxed mb-10 max-w-lg"
          >
            Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague, μάζεψε πόντους και ανέβα στην παγκόσμια κατάταξη.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex gap-3 mb-16"
          >
            <a href="/auth/register" className="bg-[#ff751f] text-black font-medium px-8 py-3.5 rounded-lg text-sm hover:bg-[#e6671a] transition-colors hover:scale-105 transform">
              Ξεκίνα δωρεάν
            </a>
            <a href="/rules" className="border border-[#333] text-white px-8 py-3.5 rounded-lg text-sm hover:bg-[#111] transition-colors">
              Πώς λειτουργεί
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-0"
          >
            <div className="pr-10 mr-10 border-r border-[#1a1a1a] text-center">
              <div className="text-3xl font-medium text-white">
                <AnimatedNumber value={totalUsers} />
              </div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΠΑΙΚΤΕΣ</div>
            </div>
            <div className="pr-10 mr-10 border-r border-[#1a1a1a] text-center">
              <div className="text-3xl font-medium text-white">{matchday ? "#" + matchday.number : "—"}</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΑΓΩΝΙΣΤΙΚΗ</div>
            </div>
            <div className="text-center">
              {matchday ? <CountdownTimer deadline={matchday.deadline} /> : <div className="text-3xl font-medium text-white">—</div>}
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">DEADLINE</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ticker */}
      {games.length > 0 && (
        <div className="bg-[#ff751f] overflow-hidden">
          <div className="flex gap-8 px-10 py-2.5 animate-none">
            {[...games, ...games].map((g, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-medium text-black">{g.homeTeam.substring(0,3).toUpperCase()} · {g.awayTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-xs text-black/60">{formatGameDate(g.date)}</span>
                <span className="text-black/30 ml-2">·</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {matchday && games.length > 0 && user && (
        <div className="w-full max-w-7xl mx-auto px-10 pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Προβλέψεις αγωνιστικής</span>
            <span className="text-xs text-[#ff751f] font-medium">{pickedCount}/{games.length}</span>
          </div>
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div
              className="h-1 bg-[#ff751f] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: progressPct + "%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Games section */}
      <div className="w-full max-w-7xl mx-auto px-10 py-8">
        <div className="flex justify-between items-center mb-5">
          <span className="text-base font-medium">
            {matchday ? "Αγωνιστική #" + matchday.number : "Δεν υπάρχει ανοιχτή αγωνιστική"}
          </span>
          {matchday && (
            <span className="text-xs text-gray-500">
              Deadline: {matchday.deadline ? (matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline)).toLocaleString("el-GR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#111] rounded-xl border border-[#1e1e1e] h-16 animate-pulse"></div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 text-sm py-16 text-center"
          >
            {matchday ? "Δεν υπάρχουν ματς ακόμα." : "Δεν υπάρχει ανοιχτή αγωνιστική αυτή τη στιγμή."}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            {games.map((g, index) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-[#111] rounded-xl border border-[#1e1e1e] px-5 py-3.5 grid grid-cols-[110px_1fr_320px_70px] items-center gap-4 hover:border-[#2a2a2a] transition-colors"
              >
                <div>
                  <div className="text-xs text-gray-400">{formatGameDate(g.date)}</div>
                  {g.status === "live" && (
                    <span className="text-[10px] bg-[#ff751f] text-black px-2 py-0.5 rounded font-medium mt-1 inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-black animate-pulse inline-block"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{g.homeTeam}</span>
                  <span className="text-xs text-gray-600">vs</span>
                  <span className="text-sm font-medium">{g.awayTeam}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePick(g.id, "home")}
                    disabled={saving === g.id}
                    className={`rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer transition-all ${
                      predictions[g.id] === "home"
                        ? "bg-[rgba(255,117,31,0.15)] border border-[#ff751f] shadow-[0_0_12px_rgba(255,117,31,0.15)]"
                        : "bg-[#1a1a1a] border border-[#222] hover:border-[#ff751f]"
                    }`}
                  >
                    <span className="text-xs font-medium">{g.homeTeam}</span>
                    <span className="text-xs text-[#ff751f] font-medium">+{g.homePoints}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePick(g.id, "away")}
                    disabled={saving === g.id}
                    className={`rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer transition-all ${
                      predictions[g.id] === "away"
                        ? "bg-[rgba(255,117,31,0.15)] border border-[#ff751f] shadow-[0_0_12px_rgba(255,117,31,0.15)]"
                        : "bg-[#1a1a1a] border border-[#222] hover:border-[#ff751f]"
                    }`}
                  >
                    <span className="text-xs font-medium">{g.awayTeam}</span>
                    <span className="text-xs text-[#ff751f] font-medium">+{g.awayPoints}</span>
                  </motion.button>
                </div>
                <div className="text-xs text-gray-600 text-right">
                  {saving === g.id ? (
                    <div className="w-4 h-4 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin ml-auto"></div>
                  ) : (
                    predictions[g.id] ? (
                      <span className="text-[#ff751f]">✓</span>
                    ) : "—"
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom widgets */}
      <div className="w-full max-w-7xl mx-auto px-10 pb-10 grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5 hover:border-[#2a2a2a] transition-colors"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-[2px] text-gray-600">ΓΕΝΙΚΗ ΚΑΤΑΤΑΞΗ</span>
            <a href="/leaderboard" className="text-xs text-[#ff751f] hover:underline">Δες όλους →</a>
          </div>
          <div className="text-gray-500 text-sm">Σύντομα...</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5 hover:border-[#2a2a2a] transition-colors"
        >
          <div className="text-[10px] tracking-[2px] text-gray-600 mb-4">Η ΘΕΣΗ ΜΟΥ</div>
          {user ? (
            <div>
              <div className="text-sm text-white font-medium mb-1">{user.displayName}</div>
              <div className="text-xs text-gray-500">{pickedCount}/{games.length} προβλέψεις αυτή την αγωνιστική</div>
              <div className="mt-3 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  className="h-1 bg-[#ff751f] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: progressPct + "%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="text-gray-500 text-sm mb-3">Συνδέσου για να δεις τη θέση σου.</div>
              <a href="/auth/login" className="text-xs text-[#ff751f] hover:underline">Σύνδεση →</a>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5 hover:border-[#2a2a2a] transition-colors"
        >
          <div className="text-[10px] tracking-[2px] text-gray-600 mb-4">ΕΒΔΟΜΑΔΙΑΙΟ CHALLENGE</div>
          <div className="bg-[rgba(255,117,31,0.06)] border border-[rgba(255,117,31,0.15)] rounded-lg p-3">
            <div className="text-xs font-medium text-[#ff751f] mb-1">Σύντομα!</div>
            <div className="text-xs text-gray-500">Εβδομαδιαία challenges με bonus πόντους.</div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}