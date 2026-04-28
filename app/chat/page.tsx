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

  // DM state
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [activeDM, setActiveDM] = useState<DMConversation | null>(null);
  const [dmMessages, setDMMessages] = useState<Message[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Global chat
  useEffect(() => {
    if (tab !== "global") return;
    const q = query(collection(db, "chat"), orderBy("createdAt", "asc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [tab]);

  // Load conversations
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
        convs.push({
          id: d.id,
          otherUserId,
          otherUsername,
          lastMessage: data.lastMessage,
          lastAt: data.lastAt,
        });
      }
      setConversations(convs);
    });
    return () => unsub();
  }, [user, tab]);

  // Load DM messages
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
        text: text.trim(),
        username: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
      });
      setText("");
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !activeDM) return;
    setSending(true);
    try {
      const dmId = activeDM.id;
      await addDoc(collection(db, "dm_conversations", dmId, "messages"), {
        text: text.trim(),
        username: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
      });
      // Update last message
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "dm_conversations", dmId), {
        members: [user.uid, activeDM.otherUserId],
        lastMessage: text.trim(),
        lastAt: new Date(),
      }, { merge: true });
      setText("");
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleSearchAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchUsername.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const q = query(collection(db, "users"), where("username", "==", searchUsername.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { setSearchError("Δεν βρέθηκε χρήστης με αυτό το username."); return; }
      const otherUser = snap.docs[0];
      if (otherUser.id === user.uid) { setSearchError("Δεν μπορείς να στείλεις μήνυμα στον εαυτό σου!"); return; }
      const dmId = getDMId(user.uid, otherUser.id);
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "dm_conversations", dmId), {
        members: [user.uid, otherUser.id],
        lastAt: new Date(),
      }, { merge: true });
      setActiveDM({
        id: dmId,
        otherUserId: otherUser.id,
        otherUsername: otherUser.data().username,
      });
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
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-[#1a1a1a]"></div>
          <span className="text-[10px] text-gray-600 bg-[#151515] border border-[#1a1a1a] px-3 py-1 rounded-full">{group.date}</span>
          <div className="flex-1 h-px bg-[#1a1a1a]"></div>
        </div>
        {group.messages.map((msg, mi) => {
          const isMe = user?.uid === msg.userId;
          const color = getUserColor(msg.userId);
          const prev = group.messages[mi - 1];
          const showAvatar = !prev || prev.userId !== msg.userId;
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 mb-1 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? (isMe ? "mr-11" : "ml-11") : ""}`}
            >
              {showAvatar ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-xs flex-shrink-0 mt-1"
                  style={{ backgroundColor: color }}>
                  {msg.username?.[0]?.toUpperCase() || "?"}
                </div>
              ) : <div className="w-8 flex-shrink-0"></div>}
              <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {showAvatar && (
                  <div className="flex items-center gap-2 px-1">
                    {!isMe && <span className="text-xs font-bold" style={{ color }}>{msg.username}</span>}
                    <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm break-words leading-relaxed ${
                  isMe
                    ? "bg-gradient-to-br from-[#ff751f] to-[#e6671a] text-black font-medium rounded-tr-sm"
                    : "bg-[#151515] text-white rounded-tl-sm border border-[#1e1e1e]"
                }`}>
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
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a] flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#ff751f] opacity-[0.04] blur-[100px] rounded-full"></div>
        </div>
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-8 relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
            <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-4">Chat</h1>

          {/* Tabs */}
          <div className="flex gap-2">
            <button onClick={() => { setTab("global"); setActiveDM(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "global" ? "bg-[#ff751f] text-black" : "bg-[#151515] border border-[#1e1e1e] text-gray-400 hover:text-white"}`}>
              🌍 Global Chat
            </button>
            <button onClick={() => setTab("dm")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "dm" ? "bg-[#ff751f] text-black" : "bg-[#151515] border border-[#1e1e1e] text-gray-400 hover:text-white"}`}>
              💬 Προσωπικά
            </button>
          </div>
        </div>
      </div>

      {/* Global Chat */}
      {tab === "global" && (
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-6 flex flex-col flex-1">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col flex-1 min-h-[400px] md:h-[520px] overflow-y-auto mb-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#151515] border border-[#1a1a1a] flex items-center justify-center text-3xl">💬</div>
                <div className="text-gray-600 text-sm text-center">Ξεκίνα τη συζήτηση!</div>
              </div>
            )}
            {renderMessages(messages)}
            <div ref={bottomRef} />
          </div>
          {user ? (
            <form onSubmit={handleSendGlobal} className="flex gap-2">
              <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all"
                placeholder="Γράψε μήνυμα..." maxLength={500} />
              <button type="submit" disabled={sending || !text.trim()}
                className="bg-[#ff751f] text-black font-black px-5 py-3.5 rounded-2xl text-sm hover:bg-[#e6671a] disabled:opacity-50 transition-all">
                {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "→"}
              </button>
            </form>
          ) : (
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 text-center text-sm text-gray-500">
              <a href="/auth/login" className="text-[#ff751f] font-bold hover:underline">Συνδέσου</a> για να στείλεις μήνυμα
            </div>
          )}
        </div>
      )}

      {/* DM */}
      {tab === "dm" && (
        <div className="w-full max-w-4xl mx-auto px-5 md:px-10 py-6 flex gap-4 flex-1">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-3">
            {/* Search */}
            <form onSubmit={handleSearchAndStart} className="flex flex-col gap-2">
              <input type="text" value={searchUsername} onChange={(e) => { setSearchUsername(e.target.value); setSearchError(""); }}
                className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all"
                placeholder="Αναζήτηση username..." />
              {searchError && <div className="text-xs text-red-400">{searchError}</div>}
              <button type="submit" disabled={searching || !searchUsername.trim()}
                className="bg-[#ff751f] text-black font-black py-2 rounded-xl text-xs hover:bg-[#e6671a] disabled:opacity-50 transition-all">
                {searching ? "Αναζήτηση..." : "+ Νέα συνομιλία"}
              </button>
            </form>

            {/* Conversations */}
            <div className="flex flex-col gap-2">
              {conversations.length === 0 && (
                <div className="text-xs text-gray-600 text-center py-4">Δεν υπάρχουν συνομιλίες ακόμα.</div>
              )}
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => setActiveDM(conv)}
                  className={`text-left px-3 py-3 rounded-xl transition-all ${activeDM?.id === conv.id ? "bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.3)]" : "bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a]"}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-black font-black text-xs flex-shrink-0"
                      style={{ backgroundColor: getUserColor(conv.otherUserId) }}>
                      {conv.otherUsername?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{conv.otherUsername}</div>
                      {conv.lastMessage && <div className="text-[10px] text-gray-600 truncate">{conv.lastMessage}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DM Chat */}
          <div className="flex-1 flex flex-col">
            {!activeDM ? (
              <div className="flex-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <div className="text-gray-600 text-sm">Επέλεξε μια συνομιλία ή ξεκίνα νέα</div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-4 py-3 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-xs"
                    style={{ backgroundColor: getUserColor(activeDM.otherUserId) }}>
                    {activeDM.otherUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-black text-sm">{activeDM.otherUsername}</span>
                </div>
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col flex-1 min-h-[350px] overflow-y-auto mb-3">
                  {dmMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                      Ξεκίνα τη συνομιλία!
                    </div>
                  )}
                  {renderMessages(dmMessages)}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleSendDM} className="flex gap-2">
                  <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                    className="flex-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all"
                    placeholder={`Μήνυμα στον ${activeDM.otherUsername}...`} maxLength={500} />
                  <button type="submit" disabled={sending || !text.trim()}
                    className="bg-[#ff751f] text-black font-black px-5 py-3.5 rounded-2xl text-sm hover:bg-[#e6671a] disabled:opacity-50 transition-all">
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