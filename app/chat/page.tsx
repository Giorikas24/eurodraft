"use client";

import { useEffect, useState, useRef } from "react";
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  username: string;
  userId: string;
  createdAt: any;
}

interface DMConversation {
  id: string;
  otherUserId: string;
  otherUsername: string;
  lastMessage?: string;
  lastAt?: any;
}

const COLORS = ["#ff751f", "#AFA9EC", "#FAC775", "#5DCAA5", "#F0997B", "#85B7EB"];
const getUserColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};
const getDMId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"global" | "dm">("global");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activeDM, setActiveDM] = useState<DMConversation | null>(null);
  const [dmMessages, setDMMessages] = useState<Message[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (tab !== "global") return;
    const q = query(collection(db, "chat"), orderBy("createdAt", "asc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [tab]);

  useEffect(() => {
    if (!user || tab !== "dm") return;
    const q = query(collection(db, "dm_conversations"), where("members", "array-contains", user.uid), orderBy("lastAt", "desc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const convs: DMConversation[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const otherUserId = data.members.find((m: string) => m !== user.uid);
        const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
        const otherUsername = otherUserDoc.exists() ? otherUserDoc.data().username : "Άγνωστος";
        convs.push({ id: d.id, otherUserId, otherUsername, lastMessage: data.lastMessage, lastAt: data.lastAt });
      }
      setConversations(convs);
    });
    return () => unsub();
  }, [user, tab]);

  useEffect(() => {
    if (!activeDM) return;
    const q = query(collection(db, "dm_conversations", activeDM.id, "messages"), orderBy("createdAt", "asc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      setDMMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [activeDM]);

  const handleSendGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, "chat"), {
        text: text.trim(), username: user.displayName || user.email, userId: user.uid, createdAt: new Date(),
      });
      setText(""); inputRef.current?.focus();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !activeDM) return;
    setSending(true);
    try {
      await addDoc(collection(db, "dm_conversations", activeDM.id, "messages"), {
        text: text.trim(), username: user.displayName || user.email, userId: user.uid, createdAt: new Date(),
      });
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "dm_conversations", activeDM.id), {
        members: [user.uid, activeDM.otherUserId], lastMessage: text.trim(), lastAt: new Date(),
      }, { merge: true });
      setText(""); inputRef.current?.focus();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleSearchAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchUsername.trim()) return;
    setSearching(true); setSearchError("");
    try {
      const q = query(collection(db, "users"), where("username", "==", searchUsername.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { setSearchError("Δεν βρέθηκε χρήστης."); return; }
      const otherUser = snap.docs[0];
      if (otherUser.id === user.uid) { setSearchError("Δεν μπορείς να στείλεις στον εαυτό σου!"); return; }
      const dmId = getDMId(user.uid, otherUser.id);
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "dm_conversations", dmId), { members: [user.uid, otherUser.id], lastAt: new Date() }, { merge: true });
      setActiveDM({ id: dmId, otherUserId: otherUser.id, otherUsername: otherUser.data().username });
      setSearchUsername("");
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const formatTime = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("el-GR", { day: "numeric", month: "long" });
  };

  const renderMessages = (msgs: Message[]) => {
    const grouped = msgs.reduce((groups: { date: string; messages: Message[] }[], msg) => {
      const date = formatDate(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.messages.push(msg);
      else groups.push({ date, messages: [msg] });
      return groups;
    }, []);

    return grouped.map((group, gi) => (
      <div key={gi}>
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 px-3 py-1 border border-white/10 bg-black" style={{ fontFamily: "Arial, sans-serif" }}>{group.date}</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>
        {group.messages.map((msg, mi) => {
          const isMe = user?.uid === msg.userId;
          const color = getUserColor(msg.userId);
          const prev = group.messages[mi - 1];
          const showAvatar = !prev || prev.userId !== msg.userId;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 mb-1.5 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? (isMe ? "mr-10" : "ml-10") : ""}`}
            >
              {showAvatar ? (
                <div className="w-8 h-8 flex items-center justify-center text-black font-black text-xs flex-shrink-0 mt-1"
                  style={{ backgroundColor: color }}>
                  {msg.username?.[0]?.toUpperCase() || "?"}
                </div>
              ) : <div className="w-8 flex-shrink-0"></div>}
              <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {showAvatar && (
                  <div className="flex items-center gap-2 px-1">
                    {!isMe && <span className="text-[10px] font-black uppercase" style={{ color }}>{msg.username}</span>}
                    <span className="text-[9px] text-gray-600" style={{ fontFamily: "Arial, sans-serif" }}>{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 text-sm break-words leading-relaxed border-2 ${
                  isMe
                    ? "bg-[#ff751f] text-black border-[#ff751f] font-black"
                    : "bg-black text-white border-white/10"
                }`} style={{ fontFamily: "Arial, sans-serif" }}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    ));
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="bg-black border-b-2 border-[#ff751f] flex-shrink-0">
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-6">
          <div className="flex items-center gap-0 mb-4">
            <div className="bg-[#ff751f] px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
            </div>
            <div className="bg-white px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Community</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase leading-none tracking-tighter mb-4">
            CH<span className="text-[#ff751f]">AT</span>
          </h1>
          {/* Tabs */}
          <div className="flex gap-0">
            <button onClick={() => { setTab("global"); setActiveDM(null); }}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                tab === "global"
                  ? "bg-[#ff751f] border-[#ff751f] text-black"
                  : "bg-transparent border-white/20 text-gray-500 hover:text-white hover:border-white/40"
              }`}>
              🌍 Global
            </button>
            <button onClick={() => setTab("dm")}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-2 border-l-0 ${
                tab === "dm"
                  ? "bg-[#ff751f] border-[#ff751f] text-black"
                  : "bg-transparent border-white/20 text-gray-500 hover:text-white hover:border-white/40"
              }`}>
              💬 Προσωπικά
            </button>
          </div>
        </div>
      </div>

      {/* Global Chat */}
      {tab === "global" && (
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-6 flex flex-col flex-1">
          <div className="border-2 border-white/10 bg-black p-4 flex flex-col flex-1 min-h-[400px] md:h-[500px] overflow-y-auto mb-3 scrollbar-none">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-16 h-16 bg-white/5 border-2 border-white/10 flex items-center justify-center text-3xl">💬</div>
                <div className="text-gray-600 text-xs uppercase font-black tracking-widest">Ξεκίνα τη συζήτηση!</div>
              </div>
            )}
            {renderMessages(messages)}
            <div ref={bottomRef} />
          </div>
          {user ? (
            <form onSubmit={handleSendGlobal} className="flex gap-0">
              <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-black border-2 border-white/10 px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all"
                style={{ fontFamily: "Arial, sans-serif" }}
                placeholder="Γράψε μήνυμα..." maxLength={500} />
              <button type="submit" disabled={sending || !text.trim()}
                className="bg-[#ff751f] text-black font-black px-6 text-sm hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f]">
                {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "→"}
              </button>
            </form>
          ) : (
            <div className="border-2 border-white/10 bg-black p-4 text-center text-xs text-gray-600 font-black uppercase tracking-widest">
              <a href="/auth/login" className="text-[#ff751f] hover:underline">Συνδέσου</a> για να γράψεις
            </div>
          )}
        </div>
      )}

      {/* DM */}
      {tab === "dm" && (
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-6 flex gap-4 flex-1">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0 flex flex-col gap-3">
            <form onSubmit={handleSearchAndStart} className="flex flex-col gap-0">
              <input type="text" value={searchUsername} onChange={(e) => { setSearchUsername(e.target.value); setSearchError(""); }}
                className="w-full bg-black border-2 border-white/10 px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all"
                style={{ fontFamily: "Arial, sans-serif" }}
                placeholder="Username..." />
              {searchError && <div className="text-[10px] text-red-400 font-black py-1 px-2 bg-red-400/10 border border-red-400/20" style={{ fontFamily: "Arial, sans-serif" }}>{searchError}</div>}
              <button type="submit" disabled={searching || !searchUsername.trim()}
                className="bg-[#ff751f] text-black font-black py-2.5 text-[10px] uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f] border-t-0">
                {searching ? "..." : "+ Νέα συνομιλία"}
              </button>
            </form>

            <div className="flex flex-col gap-0 border-2 border-white/10 overflow-hidden">
              {conversations.length === 0 ? (
                <div className="text-[10px] text-gray-600 text-center py-6 font-black uppercase tracking-widest px-3">
                  Καμία συνομιλία
                </div>
              ) : conversations.map(conv => (
                <button key={conv.id} onClick={() => setActiveDM(conv)}
                  className={`text-left px-3 py-3 border-b border-white/10 last:border-0 transition-all flex items-center gap-2 ${
                    activeDM?.id === conv.id ? "bg-[#ff751f]" : "bg-black hover:bg-white/5"
                  }`}>
                  <div className="w-7 h-7 flex items-center justify-center text-black font-black text-[10px] flex-shrink-0"
                    style={{ backgroundColor: getUserColor(conv.otherUserId) }}>
                    {conv.otherUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[10px] font-black uppercase truncate ${activeDM?.id === conv.id ? "text-black" : "text-white"}`}>{conv.otherUsername}</div>
                    {conv.lastMessage && <div className={`text-[9px] truncate ${activeDM?.id === conv.id ? "text-black/70" : "text-gray-600"}`} style={{ fontFamily: "Arial, sans-serif" }}>{conv.lastMessage}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DM Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeDM ? (
              <div className="flex-1 border-2 border-white/10 bg-black flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest">Επέλεξε συνομιλία</div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#ff751f] px-4 py-3 flex items-center gap-3 mb-0">
                  <div className="w-8 h-8 bg-black flex items-center justify-center text-[#ff751f] font-black text-xs">
                    {activeDM.otherUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-black text-black text-sm uppercase tracking-wide">{activeDM.otherUsername}</span>
                </div>
                <div className="border-2 border-white/10 border-t-0 bg-black p-4 flex flex-col flex-1 min-h-[350px] overflow-y-auto mb-0 scrollbar-none">
                  {dmMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-600 text-[10px] uppercase font-black tracking-widest">
                      Ξεκίνα τη συνομιλία!
                    </div>
                  )}
                  {renderMessages(dmMessages)}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleSendDM} className="flex gap-0">
                  <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                    className="flex-1 bg-black border-2 border-white/10 border-t-0 px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all"
                    style={{ fontFamily: "Arial, sans-serif" }}
                    placeholder={`Μήνυμα στον ${activeDM.otherUsername}...`} maxLength={500} />
                  <button type="submit" disabled={sending || !text.trim()}
                    className="bg-[#ff751f] text-black font-black px-6 text-sm hover:bg-white disabled:opacity-50 transition-all border-2 border-[#ff751f] border-t-0 border-l-0">
                    {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "→"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}