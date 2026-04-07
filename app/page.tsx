"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, limit, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

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

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [matchday, setMatchday] = useState<Matchday | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentMatchday();
  }, []);

  useEffect(() => {
    if (user && matchday) {
      fetchUserPredictions(matchday.id);
    }
  }, [user, matchday]);

  const fetchCurrentMatchday = async () => {
    try {
      const q = query(collection(db, "matchdays"), orderBy("number", "desc"), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        const data = { id: d.id, ...d.data() } as Matchday;
        if (data.status === "open") {
          setMatchday(data);
          fetchGames(d.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async (matchdayId: string) => {
    const q = query(collection(db, "matchdays", matchdayId, "games"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game));
    setGames(data);
  };

  const fetchUserPredictions = async (matchdayId: string) => {
    if (!user) return;
    const docRef = doc(db, "predictions", `${user.uid}_${matchdayId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setPredictions(docSnap.data().picks || {});
    }
  };

  const handlePick = async (gameId: string, pick: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!matchday) return;

    const deadline = matchday.deadline.toDate ? matchday.deadline.toDate() : new Date(matchday.deadline);
    if (new Date() > deadline) {
      alert("Το deadline έχει περάσει!");
      return;
    }

    setSaving(gameId);
    const newPredictions = { ...predictions, [gameId]: pick };
    setPredictions(newPredictions);

    try {
      await setDoc(doc(db, "predictions", `${user.uid}_${matchday.id}`), {
        userId: user.uid,
        matchdayId: matchday.id,
        picks: newPredictions,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const formatDeadline = (deadline: any) => {
    if (!deadline) return "";
    const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return date.toLocaleString("el-GR", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatGameDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("el-GR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  };

  const pickedCount = Object.keys(predictions).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-black border-b border-[#1a1a1a]">
        <div className="w-full max-w-7xl mx-auto px-10 py-16 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
            <span className="text-[#ff751f] text-xs tracking-[3px]">EUROLEAGUE PREDICTIONS</span>
          </div>
          <h1 className="text-6xl font-medium leading-tight mb-6">
            Πρόβλεψε.<br />Ανταγωνίσου.<br /><span className="text-[#ff751f]">Κέρδισε.</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-lg">
            Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague, μάζεψε πόντους και ανέβα στην παγκόσμια κατάταξη.
          </p>
          <div className="flex gap-3 mb-14">
            <a href="/auth/register" className="bg-[#ff751f] text-black font-medium px-8 py-3.5 rounded-lg text-sm hover:bg-[#e6671a]">Ξεκίνα δωρεάν</a>
            <button className="border border-[#333] text-white px-8 py-3.5 rounded-lg text-sm hover:bg-[#111]">Πώς λειτουργεί</button>
          </div>
          <div className="flex gap-0">
            <div className="pr-10 mr-10 border-r border-[#1a1a1a]">
              <div className="text-3xl font-medium text-white">{matchday ? `#${matchday.number}` : "—"}</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΑΓΩΝΙΣΤΙΚΗ</div>
            </div>
            <div className="pr-10 mr-10 border-r border-[#1a1a1a]">
              <div className="text-3xl font-medium text-white">{games.length}</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΜΑΤΣ</div>
            </div>
            <div>
              <div className="text-3xl font-medium text-white">{matchday ? formatDeadline(matchday.deadline) : "—"}</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">DEADLINE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      {games.length > 0 && (
        <div className="bg-[#ff751f]">
          <div className="w-full max-w-7xl mx-auto px-10 py-2.5 flex gap-8 overflow-hidden">
            {games.map((g, i) => (
              <div key={g.id} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-medium text-black">{g.homeTeam.substring(0,3).toUpperCase()} · {g.awayTeam.substring(0,3).toUpperCase()}</span>
                <span className="text-xs text-black/60">{formatGameDate(g.date)}</span>
                {i < games.length - 1 && <span className="text-black/30 ml-4">·</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Games section */}
      <div className="w-full max-w-7xl mx-auto px-10 py-8">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-base font-medium">
              {matchday ? `Αγωνιστική #${matchday.number}` : "Δεν υπάρχει ανοιχτή αγωνιστική"}
            </span>
            {matchday && (
              <span className="text-xs text-gray-500 ml-3">
                Deadline: {formatDeadline(matchday.deadline)} · Επέλεξες {pickedCount}/{games.length}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#111] rounded-xl border border-[#1e1e1e] h-16 animate-pulse"></div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center">
            {matchday ? "Δεν υπάρχουν ματς ακόμα." : "Δεν υπάρχει ανοιχτή αγωνιστική αυτή τη στιγμή."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {games.map((g) => (
              <div key={g.id} className="bg-[#111] rounded-xl border border-[#1e1e1e] px-5 py-3.5 grid grid-cols-[110px_1fr_320px_70px] items-center gap-4 hover:border-[#2a2a2a]">
                <div>
                  <div className="text-xs text-gray-400">{formatGameDate(g.date)}</div>
                  {g.status === "live" && <span className="text-[10px] bg-[#ff751f] text-black px-2 py-0.5 rounded font-medium mt-1 inline-block">LIVE</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{g.homeTeam}</span>
                  <span className="text-xs text-gray-600">vs</span>
                  <span className="text-sm font-medium">{g.awayTeam}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePick(g.id, "home")}
                    disabled={saving === g.id}
                    className={`rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer transition-all ${
                      predictions[g.id] === "home"
                        ? "bg-[rgba(255,117,31,0.15)] border border-[#ff751f]"
                        : "bg-[#1a1a1a] border border-[#222] hover:border-[#ff751f]"
                    }`}
                  >
                    <span className="text-xs font-medium">{g.homeTeam}</span>
                    <span className="text-xs text-[#ff751f] font-medium">+{g.homePoints}</span>
                  </button>
                  <button
                    onClick={() => handlePick(g.id, "away")}
                    disabled={saving === g.id}
                    className={`rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer transition-all ${
                      predictions[g.id] === "away"
                        ? "bg-[rgba(255,117,31,0.15)] border border-[#ff751f]"
                        : "bg-[#1a1a1a] border border-[#222] hover:border-[#ff751f]"
                    }`}
                  >
                    <span className="text-xs font-medium">{g.awayTeam}</span>
                    <span className="text-xs text-[#ff751f] font-medium">+{g.awayPoints}</span>
                  </button>
                </div>
                <div className="text-xs text-gray-600 text-right">
                  {saving === g.id ? "..." : `${g.homePoints}/${g.awayPoints}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom widgets */}
      <div className="w-full max-w-7xl mx-auto px-10 pb-10 grid grid-cols-3 gap-3">
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-[2px] text-gray-600">ΓΕΝΙΚΗ ΚΑΤΑΤΑΞΗ</span>
          </div>
          <div className="text-gray-500 text-sm">Σύντομα...</div>
        </div>
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="text-[10px] tracking-[2px] text-gray-600 mb-4">Η ΘΕΣΗ ΜΟΥ</div>
          {user ? (
            <div>
              <div className="text-sm text-white font-medium mb-1">{user.displayName}</div>
              <div className="text-xs text-gray-500">{pickedCount}/{games.length} προβλέψεις αυτή την αγωνιστική</div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Συνδέσου για να δεις τη θέση σου.</div>
          )}
        </div>
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="text-[10px] tracking-[2px] text-gray-600 mb-4">ΕΒΔΟΜΑΔΙΑΙΟ CHALLENGE</div>
          <div className="text-gray-500 text-sm">Σύντομα...</div>
        </div>
      </div>
    </main>
  );
}