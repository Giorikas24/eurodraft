import Navbar from "@/components/Navbar";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="bg-black border-b-2 border-[#ff751f]">
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">
          <div className="flex items-center gap-0 mb-3">
            <div className="bg-[#ff751f] px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
            </div>
            <div className="bg-white px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Rulebook</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
            ΚΑΝ<span className="text-[#ff751f]">ΟΝΕΣ</span>
          </h1>
          <p className="text-gray-600 text-xs uppercase tracking-widest mt-3 font-black" style={{ fontFamily: "Arial, sans-serif" }}>
            Όλα όσα χρειάζεται να ξέρεις.
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 flex flex-col gap-3">

        {/* What is CourtProphet */}
        <div className="border-2 border-white/10 bg-black overflow-hidden">
          <div className="bg-[#ff751f] px-4 py-2 flex items-center gap-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">01 — Τι είναι το CourtProphet;</span>
          </div>
          <div className="p-5">
            <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
              Το CourtProphet είναι μια πλατφόρμα προβλέψεων για τα παιχνίδια της Euroleague. Κάθε αγωνιστική κάνεις τις προβλέψεις σου, μαζεύεις πόντους και ανεβαίνεις στην κατάταξη.
            </p>
          </div>
        </div>

        {/* Points system */}
        <div className="border-2 border-white/10 bg-black overflow-hidden">
          <div className="bg-white px-4 py-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">02 — Σύστημα Πόντων</span>
          </div>
          <div className="p-5">
            <p className="text-gray-400 text-sm leading-relaxed mb-4" style={{ fontFamily: "Arial, sans-serif" }}>
              Για κάθε παιχνίδι μοιράζονται πόντοι ανάλογα με τις αποδόσεις. Όσο πιο απίθανο το αποτέλεσμα, τόσο περισσότεροι πόντοι.
            </p>
            <div className="grid grid-cols-2 gap-0">
              <div className="bg-[#ff751f] p-4 border-r-2 border-black">
                <div className="text-black text-xs font-black uppercase tracking-widest mb-2">Σωστή πρόβλεψη</div>
                <div className="text-black text-3xl md:text-4xl font-black tabular-nums">+2/+9</div>
                <div className="text-black/70 text-[10px] mt-1 uppercase font-black tracking-wide">ανάλογα απόδοση</div>
              </div>
              <div className="bg-white/5 p-4 border-2 border-white/10 border-l-0">
                <div className="text-white text-xs font-black uppercase tracking-widest mb-2">Λάθος πρόβλεψη</div>
                <div className="text-red-400 text-3xl md:text-4xl font-black tabular-nums">-1</div>
                <div className="text-gray-600 text-[10px] mt-1 uppercase font-black tracking-wide">πόντος αφαίρεση</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="border-2 border-white/10 bg-black overflow-hidden">
          <div className="bg-[#ff751f] px-4 py-2">
            <span className="text-black text-[9px] font-black tracking-[4px] uppercase">03 — Κατηγορίες Παικτών</span>
          </div>
          <div className="p-5">
            <p className="text-gray-400 text-sm leading-relaxed mb-4" style={{ fontFamily: "Arial, sans-serif" }}>
              Οι παίκτες χωρίζονται σε 4 κατηγορίες ανάλογα με την κατάταξή τους:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "PLATINUM", range: "Top 25%", color: "#AFA9EC", bg: "bg-[#1a1540]" },
                { label: "GOLD", range: "26% — 50%", color: "#FAC775", bg: "bg-[#3a2e00]" },
                { label: "SILVER", range: "51% — 75%", color: "#cccccc", bg: "bg-[#222]" },
                { label: "BRONZE", range: "76% — 100%", color: "#F0997B", bg: "bg-[#2a1500]" },
              ].map((cat) => (
                <div key={cat.label} className={`${cat.bg} border-2 p-3 flex items-center justify-between`} style={{ borderColor: cat.color + "40" }}>
                  <span className="text-[10px] font-black uppercase" style={{ color: cat.color }}>{cat.label}</span>
                  <span className="text-[10px] font-black" style={{ color: cat.color, fontFamily: "Arial, sans-serif" }}>{cat.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Other rules */}
        {[
          { num: "04", title: "Deadline Προβλέψεων", bg: "bg-white", textColor: "text-black", content: "Κάθε αγωνιστική έχει ένα deadline — συνήθως λίγο πριν αρχίσει το πρώτο ματς. Μετά το deadline δεν μπορείς να αλλάξεις τις προβλέψεις σου." },
          { num: "05", title: "Εβδομαδιαία Challenges", bg: "bg-[#ff751f]", textColor: "text-black", content: "Κάθε αγωνιστική υπάρχει ένα ειδικό challenge με bonus πόντους. Π.χ. \"Βρες 5 σωστά και κέρδισε +10 πόντους\". Επίσης, αν έχεις 100% στις προβλέψεις μιας αγωνιστικής, κερδίζεις αυτόματα +10 bonus πόντους!" },
          { num: "06", title: "Κύπελλο", bg: "bg-white", textColor: "text-black", content: "Τις πρώτες 8 αγωνιστικές κατατάσσουν τους παίκτες στις 4 κατηγορίες. Μετά ξεκινά το Κύπελλο — knock-out διοργάνωση όπου παίκτες της ίδιας κατηγορίας παίζουν μεταξύ τους." },
          { num: "07", title: "Ιδιωτικά Πρωταθλήματα", bg: "bg-[#ff751f]", textColor: "text-black", content: "Μπορείς να φτιάξεις το δικό σου πρωτάθλημα με φίλους. Δημιούργησε ένα ιδιωτικό league, μοιράσου τον κωδικό και ανταγωνίσου παράλληλα με τη γενική κατάταξη." },
        ].map((s, i) => (
          <div key={i} className="border-2 border-white/10 bg-black overflow-hidden">
            <div className={`${s.bg} px-4 py-2`}>
              <span className={`${s.textColor} text-[9px] font-black tracking-[4px] uppercase`}>{s.num} — {s.title}</span>
            </div>
            <div className="p-5">
              <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>{s.content}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}