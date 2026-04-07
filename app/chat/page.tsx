"use client";

import { useEffect, useState, useRef } from "react";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  text: string;
  username: string;
  userId: string;
  createdAt: any;
}

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "chat"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

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
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "chat"), {
        text: text.trim(),
        username: user.displayName || user.email,
        userId: user.uid,
        createdAt: new Date(),
      });
      setText("");
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

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-10 py-8 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
          <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
        </div>
        <h1 className="text-3xl font-medium mb-6">Chat</h1>

        {/* Messages */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 flex flex-col gap-3 h-[500px] overflow-y-auto mb-4">
          {messages.length === 0 && (
            <div className="text-gray-500 text-sm text-center mt-8">Δεν υπάρχουν μηνύματα ακόμα. Ξεκίνα τη συζήτηση!</div>
          )}
          {messages.map((msg) => {
            const isMe = user?.uid === msg.userId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-[#ff751f] flex items-center justify-center text-black font-medium text-xs flex-shrink-0">
                  {msg.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className="flex items-center gap-2">
                    {!isMe && <span className="text-xs text-gray-500">{msg.username}</span>}
                    <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-[#ff751f] text-black rounded-tr-sm"
                      : "bg-[#1a1a1a] text-white rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {user ? (
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff751f]"
              placeholder="Γράψε μήνυμα..."
              maxLength={500}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-[#ff751f] text-black font-medium px-6 py-3 rounded-xl text-sm hover:bg-[#e6671a] disabled:opacity-50"
            >
              Αποστολή
            </button>
          </form>
        ) : (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
            <span className="text-gray-500 text-sm">
              <a href="/auth/login" className="text-[#ff751f] hover:underline">Συνδέσου</a> για να στείλεις μήνυμα
            </span>
          </div>
        )}
      </div>
    </main>
  );
}