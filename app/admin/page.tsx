"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_EMAIL = "georgelipas05@gmail.com"; 

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="bg-black border-b border-[#1a1a1a] h-16 flex items-center px-10">
        <a href="/" className="font-bold text-2xl tracking-widest">
          <span className="text-[#ff751f]">EURO</span>
          <span className="text-white">DRAFT</span>
        </a>
        <span className="ml-4 text-xs text-gray-500 border border-[#333] px-2 py-1 rounded">ADMIN</span>
      </nav>

      <div className="max-w-4xl mx-auto px-10 py-12">
        <h1 className="text-3xl font-medium mb-8">Admin Panel</h1>
        <div className="grid grid-cols-2 gap-4">
          <a href="/admin/matchdays" className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 hover:border-[#ff751f] transition-colors">
            <div className="text-2xl mb-2">🏀</div>
            <div className="text-lg font-medium mb-1">Αγωνιστικές</div>
            <div className="text-sm text-gray-500">Δημιούργησε αγωνιστικές και πρόσθεσε ματς</div>
          </a>
        </div>
      </div>
    </main>
  );
}