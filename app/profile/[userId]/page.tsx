"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getBadge } from "@/lib/badges";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

interface UserStats {
  username: string;
  email: string;
  points: number;
  createdAt: any;
}

interface MatchdayHistory {
  matchdayId: string;
  matchdayNumber: number;
  matchdayName?: string;
  picks: Record<string, string>;
  games: GameResult[];
}

interface GameResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  result: string | null;
  status: string;
  homePoints: number;
  awayPoints: number;
  handicapLines: any[];
  ouLines: any[];
  playerProps: any[];
  pick: string | null;
  hcpPick: string | null;
  ouPick: string | null;
  propPicks: Record<string, string>;
}

export default function PublicProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const profileUserId = params.userId as string;

  const [stats, setStats] = useState<UserStats | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "history">("stats");
  const [history, setHistory] = useState<MatchdayHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedMatchday, setExpandedMatchday] = useState<string | null>(null);

  const isOwnProfile = user?.uid === profileUserId;

  useEffect(() => { fetchAll(); }, [profileUserId]);

  const fetchAll = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", profileUserId));
      if (!userDoc.exists()) { router.push("/leaderboard"); return; }
      setStats(userDoc.data() as UserStats);

      const allUsersSnap = await getDocs(collection(db, "users"));
      const allUsers = allUsersSnap.docs.map(d => ({ id: d.id, points: d.data().points || 0 }));
      allUsers.sort((a, b) => b.points - a.points);
      setTotalUsers(allUsers.length);
      setRank(allUsers.findIndex(u => u.id === profileUserId) + 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    if (history.length > 0) return;
    setHistoryLoading(true);
    try {
      // Fetch predictions for this user
      const predictionsSnap = await getDocs(query(collection(db, "predictions"), where("userId", "==", profileUserId)));
      const matchdaysSnap = await getDocs(collection(db, "matchdays"));
      const matchdaysMap: Record<string, { number: number; name?: string }> = {};
      matchdaysSnap.docs.forEach(d => {
        matchdaysMap[d.id] = { number: d.data().number, name: d.data().name };
      });

      const historyData: MatchdayHistory[] = [];

      for (const predDoc of predictionsSnap.docs) {
        const pred = predDoc.data();
        const matchdayId = pred.matchdayId;
        const picks = pred.picks || {};

        // Only show finished matchdays (deadline passed)
        const matchdayDoc = await getDoc(doc(db, "matchdays", matchdayId));
        if (!matchdayDoc.exists()) continue;
        const matchdayData = matchdayDoc.data();
        const deadline = matchdayData.deadline?.toDate ? matchdayData.deadline.toDate() : new Date(matchdayData.deadline);
        if (deadline > new Date()) continue; // skip open matchdays

        const gamesSnap = await getDocs(collection(db, "matchdays", matchdayId, "games"));
        const games: GameResult[] = gamesSnap.docs.map(g => {
          const game = g.data();
          // Find prop picks
          const propPicks: Record<string, string> = {};
          Object.keys(picks).forEach(k => {
            if (k.startsWith(`${g.id}_prop_`)) propPicks[k] = picks[k];
          });
          return {
            id: g.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            result: game.result,
            status: game.status,
            homePoints: game.homePoints,
            awayPoints: game.awayPoints,
            handicapLines: game.handicapLines || [],
            ouLines: game.ouLines || [],
            playerProps: game.playerProps || [],
            pick: picks[g.id] || null,
            hcpPick: Object.keys(picks).find(k => k.startsWith(`${g.id}_hcp_`)) ? picks[Object.keys(picks).find(k => k.startsWith(`${g.id}_hcp_`))!] : null,
            ouPick: Object.keys(picks).find(k => k.startsWith(`${g.id}_ou_`)) ? picks[Object.keys(picks).find(k => k.startsWith(`${g.id}_ou_`))!] : null,
            propPicks,
          };
        });

        historyData.push({
          matchdayId,
          matchdayNumber: matchdaysMap[matchdayId]?.number || 0,
          matchdayName: matchdaysMap[matchdayId]?.name,
          picks,
          games,
        });
      }

      historyData.sort((a, b) => b.matchdayNumber - a.matchdayNumber);
      setHistory(historyData);
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);

  const badge = rank > 0 && totalUsers > 0 ? getBadge(rank, totalUsers) : null;

  const getPickResult = (game: GameResult) => {
    if (!game.pick || !game.result) return "pending";
    return game.pick === game.result ? "win" : "loss";
  };

  const getHCPResult = (game: GameResult) => {
    const pickKey = Object.keys(game.propPicks).find(k => k.startsWith(`${game.id}_hcp_`));
    if (!pickKey) return null;
    const lineIndex = parseInt(pickKey.split("_hcp_")[1]);
    const line = game.handicapLines[lineIndex];
    if (!line?.result) return "pending";
    return line.result === "win" ? "win" : "loss";
  };

  const getOUResult = (game: GameResult) => {
    const pickKey = Object.keys(game.propPicks).find(k => k.startsWith(`${game.id}_ou_`));
    if (!pickKey) return null;
    const lineIndex = parseInt(pickKey.split("_ou_")[1]);
    const line = game.ouLines[lineIndex];
    if (!line?.result) return "pending";
    return line.result === "win" ? "win" : "loss";
  };

  if (loading) return (
    <main className="min-h-screen bg-[#0a0a0a]" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="bg-black border-b-2 border-[#ff751f]">
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">
          <div className="flex items-center gap-0 mb-3">
            <button onClick={() => router.back()}
              className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-[#ff751f] transition-colors mr-4">
              ← Πίσω
            </button>
            <div className="bg-[#ff751f] px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
            </div>
            <div className="bg-white px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Player Card</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
            {stats?.username || "ΠΑΙΚΤΗΣ"}
          </h1>
          {isOwnProfile && (
            <div className="mt-2">
              <span className="text-[10px] text-[#ff751f] font-black uppercase tracking-widest">★ Το προφίλ μου</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">

        {/* Player card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="border-2 border-white/10 bg-black mb-4 overflow-hidden">
          <div className="h-2 bg-[#ff751f]"></div>
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ff751f] flex items-center justify-center text-black text-3xl md:text-4xl font-black flex-shrink-0">
                {stats?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl md:text-2xl font-black uppercase truncate">{stats?.username}</div>
                {badge && (
                  <span className={`text-[8px] px-2 py-0.5 font-black mt-2 inline-block uppercase ${badge.class}`}>{badge.label}</span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-4xl md:text-5xl font-black text-[#ff751f] leading-none tabular-nums">#{rank}</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1" style={{ fontFamily: "Arial, sans-serif" }}>κατάταξη</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-0 mb-6 border-2 border-white/10 overflow-hidden">
          <div className="p-4 md:p-5 text-center border-r border-white/10 bg-[#ff751f]">
            <div className="text-2xl md:text-3xl font-black tabular-nums text-black">{stats?.points || 0}</div>
            <div className="text-[9px] uppercase tracking-widest mt-1 font-black text-black/70" style={{ fontFamily: "Arial, sans-serif" }}>Πόντοι</div>
          </div>
          <div className="p-4 md:p-5 text-center bg-black">
            <div className="text-2xl md:text-3xl font-black tabular-nums text-white">#{rank}</div>
            <div className="text-[9px] uppercase tracking-widest mt-1 font-black text-gray-600" style={{ fontFamily: "Arial, sans-serif" }}>από {totalUsers} παίκτες</div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6">
          <button onClick={() => setTab("stats")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
              tab === "stats" ? "bg-[#ff751f] border-[#ff751f] text-black" : "border-white/10 text-gray-500 hover:text-white hover:border-white/30"
            }`}>
            Στατιστικά
          </button>
          <button onClick={() => setTab("history")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-l-0 transition-all ${
              tab === "history" ? "bg-[#ff751f] border-[#ff751f] text-black" : "border-white/10 text-gray-500 hover:text-white hover:border-white/30"
            }`}>
            Ιστορικό Προβλέψεων
          </button>
        </div>

        {/* Stats tab */}
        {tab === "stats" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border-2 border-white/10 bg-black p-6 text-center">
            <div className="text-gray-600 text-xs uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
              Περισσότερα στατιστικά σύντομα...
            </div>
          </motion.div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {historyLoading ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/[0.02] border-2 border-white/10 animate-pulse"></div>)}
              </div>
            ) : history.length === 0 ? (
              <div className="border-2 border-white/10 bg-black p-10 text-center">
                <div className="text-gray-600 text-xs uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                  Δεν υπάρχουν ολοκληρωμένες αγωνιστικές ακόμα.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((md) => {
                  const isExpanded = expandedMatchday === md.matchdayId;
                  return (
                    <div key={md.matchdayId} className="border-2 border-white/10 bg-black overflow-hidden">
                      {/* Matchday header */}
                      <button
                        onClick={() => setExpandedMatchday(isExpanded ? null : md.matchdayId)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-[#ff751f] w-8 h-8 flex items-center justify-center text-black font-black text-xs">
                            #{md.matchdayNumber}
                          </div>
                          <span className="text-sm font-black uppercase">
                            {md.matchdayName || `Αγωνιστική #${md.matchdayNumber}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                            {md.games.filter(g => g.pick).length}/{md.games.length} picks
                          </span>
                          <span className="text-[#ff751f] font-black text-sm">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {/* Games */}
                      {isExpanded && (
                        <div className="border-t border-white/10">
                          {md.games.map((g, i) => {
                            const result12 = getPickResult(g);
                            return (
                              <div key={g.id} className="border-b border-white/[0.06] last:border-0 p-4">
                                {/* Game title */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-black uppercase text-white">
                                    {g.homeTeam} <span className="text-[#ff751f]">vs</span> {g.awayTeam}
                                  </span>
                                  {g.result && (
                                    <span className="text-[9px] font-black uppercase text-gray-500" style={{ fontFamily: "Arial, sans-serif" }}>
                                      Νικητής: {g.result === "home" ? g.homeTeam : g.awayTeam}
                                    </span>
                                  )}
                                </div>

                                {/* 1/2 pick */}
                                {g.pick && (
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">1/2</span>
                                      <span className="text-xs font-black uppercase text-white">
                                        {g.pick === "home" ? g.homeTeam : g.awayTeam}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                                      result12 === "win" ? "text-green-400 border-green-400/30 bg-green-400/10" :
                                      result12 === "loss" ? "text-red-400 border-red-400/30 bg-red-400/10" :
                                      "text-gray-600 border-white/10"
                                    }`}>
                                      {result12 === "win" ? "✓ +" + (g.pick === "home" ? g.homePoints : g.awayPoints) + "πτς" :
                                       result12 === "loss" ? "✗ -1πτς" : "⏳"}
                                    </span>
                                  </div>
                                )}

                                {/* HCP pick */}
                                {Object.keys(g.propPicks).filter(k => k.startsWith(`${g.id}_hcp_`)).map(pickKey => {
                                  const lineIndex = parseInt(pickKey.split("_hcp_")[1]);
                                  const line = g.handicapLines[lineIndex];
                                  if (!line) return null;
                                  const teamName = line.team === "home" ? g.homeTeam : g.awayTeam;
                                  return (
                                    <div key={pickKey} className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">HCP</span>
                                        <span className="text-xs font-black uppercase text-white">
                                          {teamName} {line.line > 0 ? "+" : ""}{line.line}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                                        line.result === "win" ? "text-green-400 border-green-400/30 bg-green-400/10" :
                                        line.result === "loss" ? "text-red-400 border-red-400/30 bg-red-400/10" :
                                        "text-gray-600 border-white/10"
                                      }`}>
                                        {line.result === "win" ? "✓ +" + line.points + "πτς" :
                                         line.result === "loss" ? "✗ -1πτς" : "⏳"}
                                      </span>
                                    </div>
                                  );
                                })}

                                {/* OU pick */}
                                {Object.keys(g.propPicks).filter(k => k.startsWith(`${g.id}_ou_`)).map(pickKey => {
                                  const lineIndex = parseInt(pickKey.split("_ou_")[1]);
                                  const line = g.ouLines[lineIndex];
                                  if (!line) return null;
                                  return (
                                    <div key={pickKey} className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">O/U</span>
                                        <span className="text-xs font-black uppercase text-white">
                                          {line.type === "over" ? "Over" : "Under"} {line.line}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                                        line.result === "win" ? "text-green-400 border-green-400/30 bg-green-400/10" :
                                        line.result === "loss" ? "text-red-400 border-red-400/30 bg-red-400/10" :
                                        "text-gray-600 border-white/10"
                                      }`}>
                                        {line.result === "win" ? "✓ +" + line.points + "πτς" :
                                         line.result === "loss" ? "✗ -1πτς" : "⏳"}
                                      </span>
                                    </div>
                                  );
                                })}

                                {/* Player Props */}
                                {Object.keys(g.propPicks).filter(k => k.startsWith(`${g.id}_prop_`)).map(pickKey => {
                                  const propIndex = parseInt(pickKey.split("_prop_")[1]);
                                  const prop = g.playerProps[propIndex];
                                  if (!prop) return null;
                                  const pick = g.propPicks[pickKey];
                                  const isCorrect = prop.result && pick === prop.result;
                                  const isWrong = prop.result && pick !== prop.result;
                                  return (
                                    <div key={pickKey} className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">PROP</span>
                                        <span className="text-xs font-black uppercase text-white">
                                          {prop.playerName} {pick === "over" ? "Over" : "Under"} {prop.line}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                                        isCorrect ? "text-green-400 border-green-400/30 bg-green-400/10" :
                                        isWrong ? "text-red-400 border-red-400/30 bg-red-400/10" :
                                        "text-gray-600 border-white/10"
                                      }`}>
                                        {isCorrect ? "✓ +" + (pick === "over" ? prop.overPoints : prop.underPoints) + "πτς" :
                                         isWrong ? "✗ -1πτς" : "⏳"}
                                      </span>
                                    </div>
                                  );
                                })}

                                {!g.pick && Object.keys(g.propPicks).length === 0 && (
                                  <div className="text-[10px] text-gray-700 font-black uppercase tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                                    Καμία πρόβλεψη
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}