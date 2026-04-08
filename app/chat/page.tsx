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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(data);
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
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
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
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
    return groups;
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-10 py-8 flex flex-col flex-1">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f] animate-pulse"></div>
            <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-medium">Chat</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              {messages.length} μηνύματα
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex flex-col gap-2 h-[520px] overflow-y-auto mb-4 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="text-4xl">💬</div>
              <div className="text-gray-500 text-sm text-center">Δεν υπάρχουν μηνύματα ακόμα.<br />Ξεκίνα τη συζήτηση!</div>
            </div>
          )}

          {groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#1e1e1e]"></div>
                <span className="text-[10px] text-gray-600">{group.date}</span>
                <div className="flex-1 h-px bg-[#1e1e1e]"></div>
              </div>
              {group.messages.map((msg, mi) => {
                const isMe = user?.uid === msg.userId;
                const color = getUserColor(msg.userId);
                const prevMsg = group.messages[mi - 1];
                const showAvatar = !prevMsg || prevMsg.userId !== msg.userId;

                return (
                  <AnimatePresence key={msg.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? (isMe ? "mr-10" : "ml-10") : ""}`}
                    >
                      {showAvatar ? (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-black font-medium text-xs flex-shrink-0 mt-1"
                          style={{ backgroundColor: color }}
                        >
                          {msg.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                        {showAvatar && (
                          <div className="flex items-center gap-2 px-1">
                            {!isMe && <span className="text-xs font-medium" style={{ color }}>{msg.username}</span>}
                            <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm break-words ${
                          isMe
                            ? "bg-[#ff751f] text-black rounded-tr-sm"
                            : "bg-[#1a1a1a] text-white rounded-tl-sm border border-[#2a2a2a]"
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
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSend}
            className="flex gap-3"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f] transition-colors pr-12"
                placeholder="Γράψε μήνυμα..."
                maxLength={500}
              />
              {text.length > 400 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
                  {500 - text.length}
                </span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-[#ff751f] text-black font-medium px-6 py-3 rounded-xl text-sm hover:bg-[#e6671a] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Αποστολή"
              )}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center"
          >
            <span className="text-gray-500 text-sm">
              <a href="/auth/login" className="text-[#ff751f] hover:underline">Συνδέσου</a> για να στείλεις μήνυμα
            </span>
          </motion.div>
        )}
      </div>
    </main>
  );
}