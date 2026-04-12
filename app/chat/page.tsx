"use client";

import { useEffect, useState, useRef } from "react";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
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

const COLORS = ["#ff751f", "#AFA9EC", "#FAC775", "#5DCAA5", "#F0997B", "#85B7EB"];
const getUserColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, "chat"), orderBy("createdAt", "asc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) { router.push("/auth/login"); return; }
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

  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], msg) => {
    const date = formatDate(msg.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === date) lastGroup.messages.push(msg);
    else groups.push({ date, messages: [msg] });
    return groups;
  }, []);

  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a] flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#ff751f] opacity-[0.04] blur-[100px] rounded-full"></div>
        </div>
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 relative">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
              <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Chat</h1>
              <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]"></div>
                <span className="text-xs text-gray-400 font-medium">{messages.length} μηνύματα</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-6 flex flex-col flex-1">

        {/* Messages */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-1 flex-1 min-h-[400px] md:h-[520px] overflow-y-auto mb-4 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[#151515] border border-[#1a1a1a] flex items-center justify-center text-3xl">💬</div>
              <div className="text-gray-600 text-sm text-center leading-relaxed">
                Δεν υπάρχουν μηνύματα ακόμα.<br />
                <span className="text-gray-500">Ξεκίνα τη συζήτηση!</span>
              </div>
            </div>
          )}

          {groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#1a1a1a]"></div>
                <span className="text-[10px] text-gray-600 bg-[#151515] border border-[#1a1a1a] px-3 py-1 rounded-full">{group.date}</span>
                <div className="flex-1 h-px bg-[#1a1a1a]"></div>
              </div>
              {group.messages.map((msg, mi) => {
                const isMe = user?.uid === msg.userId;
                const color = getUserColor(msg.userId);
                const prevMsg = group.messages[mi - 1];
                const showAvatar = !prevMsg || prevMsg.userId !== msg.userId;
                return (
                  <AnimatePresence key={msg.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2.5 mb-1 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? (isMe ? "mr-11" : "ml-11") : ""}`}
                    >
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-xs flex-shrink-0 mt-1 shadow-lg"
                          style={{ backgroundColor: color }}>
                          {msg.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}
                      <div className={`max-w-[80%] md:max-w-[75%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                        {showAvatar && (
                          <div className="flex items-center gap-2 px-1">
                            {!isMe && <span className="text-xs font-bold" style={{ color }}>{msg.username}</span>}
                            <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm break-words leading-relaxed ${
                          isMe
                            ? "bg-gradient-to-br from-[#ff751f] to-[#e6671a] text-black font-medium rounded-tr-sm shadow-[0_0_15px_rgba(255,117,31,0.2)]"
                            : "bg-[#151515] text-white rounded-tl-sm border border-[#1e1e1e]"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </motion.div>

        {/* Input */}
        {user ? (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onSubmit={handleSend} className="flex gap-2 md:gap-3">
            <div className="flex-1 relative">
              <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-all pr-12"
                placeholder="Γράψε μήνυμα..." maxLength={500} />
              {text.length > 400 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">{500 - text.length}</span>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={sending || !text.trim()}
              className="bg-[#ff751f] text-black font-black px-4 md:px-6 py-3.5 rounded-2xl text-sm hover:bg-[#e6671a] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,117,31,0.3)] hover:shadow-[0_0_30px_rgba(255,117,31,0.5)] flex items-center gap-2">
              {sending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="hidden md:inline">Αποστολή</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </>
              )}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 text-center">
            <div className="text-gray-500 text-sm">
              <a href="/auth/login" className="text-[#ff751f] hover:underline font-bold">Συνδέσου</a> για να στείλεις μήνυμα
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}