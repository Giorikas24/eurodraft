"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, where, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";
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

function ChatContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [showSearch, setShowSearch] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const [dmHandled, setDmHandled] = useState(false);

useEffect(() => {
  const dmId = searchParams.get("dm");
  const username = searchParams.get("username");
  if (dmId && username && user && !dmHandled) {
    const otherUserId = dmId.split("_").find(id => id !== user.uid) || "";
    setActiveDM({ id: dmId, otherUserId, otherUsername: username });
    setTab("dm");
    setMobileView("chat");
    setDmHandled(true);
  }
}, [searchParams, user, dmHandled]);

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
    if (!user) return;
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
  }, [user]);

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
      await setDoc(doc(db, "dm_conversations", dmId), { members: [user.uid, otherUser.id], lastAt: new Date() }, { merge: true });
      const newConv = { id: dmId, otherUserId: otherUser.id, otherUsername: otherUser.data().username };
      setActiveDM(newConv);
      setSearchUsername("");
      setShowSearch(false);
      setMobileView("chat");
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const openDM = (conv: DMConversation) => {
    setActiveDM(conv);
    setMobileView("chat");
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

  const formatLastAt = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "μόλις τώρα";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}λ`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}ω`;
    return d.toLocaleDateString("el-GR", { day: "numeric", month: "numeric" });
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
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {showAvatar && (
                  <div className="flex items-center gap-2 px-1">
                    {!isMe && <span className="text-[10px] font-black uppercase" style={{ color }}>{msg.username}</span>}
                    <span className="text-[9px] text-gray-600" style={{ fontFamily: "Arial, sans-serif" }}>{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 text-sm break-words leading-relaxed ${
                  isMe ? "bg-[#ff751f] text-black font-black" : "bg-white/10 text-white"
                }`} style={{ fontFamily: "Arial, sans-serif", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px" }}>
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
    <main className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      {/* Tabs */}
      <div className="bg-black border-b-2 border-[#ff751f] flex-shrink-0">
        <div className="flex">
          <button onClick={() => { setTab("global"); setMobileView("list"); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-r border-white/10 ${
              tab === "global" ? "bg-[#ff751f] text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}>
            🌍 Global
          </button>
          <button onClick={() => { setTab("dm"); setMobileView("list"); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === "dm" ? "bg-[#ff751f] text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}>
            💬 Μηνύματα
          </button>
        </div>
      </div>

      {/* GLOBAL CHAT */}
      {tab === "global" && (
        <div className="flex flex-col flex-1 overflow-hidden max-w-2xl w-full mx-auto">
          <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="text-5xl">💬</div>
                <div className="text-gray-600 text-xs uppercase font-black tracking-widest">Ξεκίνα τη συζήτηση!</div>
              </div>
            )}
            {renderMessages(messages)}
            <div ref={bottomRef} />
          </div>
          {user ? (
            <form onSubmit={handleSendGlobal} className="flex gap-0 border-t-2 border-white/10 bg-black flex-shrink-0">
              <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-black px-4 py-4 text-sm text-white placeholder-gray-600 focus:outline-none"
                style={{ fontFamily: "Arial, sans-serif" }}
                placeholder="Γράψε μήνυμα..." maxLength={500} />
              <button type="submit" disabled={sending || !text.trim()}
                className="bg-[#ff751f] text-black font-black px-6 disabled:opacity-50 transition-all">
                {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "→"}
              </button>
            </form>
          ) : (
            <div className="border-t-2 border-white/10 bg-black p-4 text-center text-xs text-gray-600 font-black uppercase tracking-widest flex-shrink-0">
              <a href="/auth/login" className="text-[#ff751f] hover:underline">Συνδέσου</a> για να γράψεις
            </div>
          )}
        </div>
      )}

      {/* DM */}
      {tab === "dm" && (
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Conversations list */}
          <div className={`flex-shrink-0 border-r border-white/10 flex flex-col bg-black ${
            activeDM ? "hidden md:flex md:w-72" : "w-full md:w-72"
          }`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <span className="text-sm font-black uppercase tracking-widest text-white">
                {user?.displayName || "Messages"}
              </span>
              <button onClick={() => setShowSearch(!showSearch)}
                className={`w-8 h-8 flex items-center justify-center font-black text-lg transition-all ${
                  showSearch ? "text-[#ff751f]" : "text-gray-500 hover:text-white"
                }`}>
                ✏️
              </button>
            </div>

            <AnimatePresence>
              {showSearch && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-b border-white/10 overflow-hidden flex-shrink-0">
                  <form onSubmit={handleSearchAndStart} className="p-3 flex flex-col gap-2">
                    <input type="text" value={searchUsername} onChange={(e) => { setSearchUsername(e.target.value); setSearchError(""); }}
                      className="w-full bg-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/15 transition-all"
                      style={{ fontFamily: "Arial, sans-serif", borderRadius: 8 }}
                      placeholder="Αναζήτηση username..." autoFocus />
                    {searchError && <div className="text-[10px] text-red-400 font-black uppercase" style={{ fontFamily: "Arial, sans-serif" }}>{searchError}</div>}
                    <button type="submit" disabled={searching || !searchUsername.trim()}
                      className="bg-[#ff751f] text-black font-black py-2 text-[10px] uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all"
                      style={{ borderRadius: 8 }}>
                      {searching ? "..." : "Έναρξη συνομιλίας"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto scrollbar-none">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <div className="text-4xl">🔒</div>
                  <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest text-center">Συνδέσου για να δεις τα μηνύματά σου</div>
                  <a href="/auth/login" className="text-[#ff751f] text-xs font-black uppercase tracking-widest hover:underline">Σύνδεση →</a>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <div className="text-4xl">💬</div>
                  <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest text-center">Καμία συνομιλία ακόμα</div>
                  <button onClick={() => setShowSearch(true)} className="text-[#ff751f] text-xs font-black uppercase tracking-widest hover:underline">
                    Ξεκίνα νέα →
                  </button>
                </div>
              ) : conversations.map(conv => {
                const isActive = activeDM?.id === conv.id;
                const color = getUserColor(conv.otherUserId);
                return (
                  <button key={conv.id} onClick={() => openDM(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] transition-all text-left ${
                      isActive ? "bg-white/10" : "hover:bg-white/5"
                    }`}>
                    <div className="w-12 h-12 flex items-center justify-center text-black font-black text-lg flex-shrink-0"
                      style={{ backgroundColor: color, borderRadius: "50%" }}>
                      {conv.otherUsername?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-black uppercase text-white truncate">{conv.otherUsername}</span>
                        <span className="text-[9px] text-gray-600 flex-shrink-0 ml-2" style={{ fontFamily: "Arial, sans-serif" }}>
                          {formatLastAt(conv.lastAt)}
                        </span>
                      </div>
                      {conv.lastMessage && (
                        <div className="text-[11px] text-gray-500 truncate" style={{ fontFamily: "Arial, sans-serif" }}>
                          {conv.lastMessage}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Active DM */}
          <div className={`flex-1 flex flex-col overflow-hidden ${!activeDM ? "hidden md:flex" : "flex"}`}>
            {!activeDM ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 border-2 border-white/10 flex items-center justify-center text-4xl">💬</div>
                <div className="text-center">
                  <div className="text-lg font-black uppercase mb-2">Τα μηνύματά σου</div>
                  <div className="text-gray-600 text-xs uppercase font-black tracking-widest mb-4">Στείλε μήνυμα σε έναν παίκτη</div>
                  <button onClick={() => setShowSearch(true)}
                    className="bg-[#ff751f] text-black font-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-white transition-all">
                    Νέο μήνυμα
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black flex-shrink-0">
                  <button onClick={() => { setActiveDM(null); setMobileView("list"); }}
                    className="md:hidden text-[#ff751f] font-black text-lg mr-1">←</button>
                  <div className="w-10 h-10 flex items-center justify-center text-black font-black text-base flex-shrink-0"
                    style={{ backgroundColor: getUserColor(activeDM.otherUserId), borderRadius: "50%" }}>
                    {activeDM.otherUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase text-white">{activeDM.otherUsername}</div>
                    <div className="text-[10px] text-gray-600 uppercase font-black tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
                      CourtProphet Player
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
                  {dmMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-16 h-16 flex items-center justify-center text-black font-black text-2xl"
                        style={{ backgroundColor: getUserColor(activeDM.otherUserId), borderRadius: "50%" }}>
                        {activeDM.otherUsername?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black uppercase mb-1">{activeDM.otherUsername}</div>
                        <div className="text-gray-600 text-[10px] uppercase font-black tracking-widest">CourtProphet Player</div>
                      </div>
                    </div>
                  )}
                  {renderMessages(dmMessages)}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSendDM} className="flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-black flex-shrink-0">
                  <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                    className="flex-1 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/15 transition-all"
                    style={{ fontFamily: "Arial, sans-serif", borderRadius: 24 }}
                    placeholder="Μήνυμα..." maxLength={500} />
                  <button type="submit" disabled={sending || !text.trim()}
                    className="w-10 h-10 bg-[#ff751f] text-black font-black flex items-center justify-center disabled:opacity-50 transition-all flex-shrink-0"
                    style={{ borderRadius: "50%" }}>
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

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#ff751f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}