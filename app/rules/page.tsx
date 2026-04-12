import Navbar from "@/components/Navbar";

export default function RulesPage() {
  const sections = [
    {
      icon: "🏀",
      title: "Τι είναι το EuroDraft;",
      content: "Το EuroDraft είναι μια πλατφόρμα προβλέψεων για τα παιχνίδια της Euroleague. Κάθε αγωνιστική κάνεις τις προβλέψεις σου, μαζεύεις πόντους και ανεβαίνεις στην κατάταξη.",
    },
    {
      icon: "⏰",
      title: "Deadline προβλέψεων",
      content: "Κάθε αγωνιστική έχει ένα deadline — συνήθως λίγο πριν αρχίσει το πρώτο ματς. Μετά το deadline δεν μπορείς να αλλάξεις τις προβλέψεις σου.",
    },
    {
      icon: "⚡",
      title: "Εβδομαδιαία Challenges",
      content: "Κάθε αγωνιστική υπάρχει ένα ειδικό challenge με bonus πόντους. Π.χ. \"Βρες 4 σωστά και κέρδισε +10 πόντους\". Αν έχεις 100% στις προβλέψεις μιας αγωνιστικής, κερδίζεις +10 bonus πόντους!",
    },
    {
      icon: "🏆",
      title: "Κύπελλο",
      content: "Τις πρώτες 8 αγωνιστικές κατατάσσουν τους παίκτες στις 4 κατηγορίες. Μετά ξεκινά το Κύπελλο — knock-out διοργάνωση όπου παίκτες της ίδιας κατηγορίας παίζουν μεταξύ τους.",
    },
    {
      icon: "🔒",
      title: "Ιδιωτικά πρωταθλήματα",
      content: "Μπορείς να φτιάξεις το δικό σου πρωτάθλημα με φίλους. Δημιούργησε ένα ιδιωτικό league, μοιράσου τον κωδικό και ανταγωνίσου με την παρέα σου παράλληλα με τη γενική κατάταξη.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#ff751f] opacity-[0.05] blur-[100px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "linear-gradient(#ff751f 1px, transparent 1px), linear-gradient(90deg, #ff751f 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}></div>
        </div>
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-10 relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
            <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Κανόνες</h1>
          <p className="text-gray-600 text-sm mt-2">Όλα όσα χρειάζεται να ξέρεις για το EuroDraft.</p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-10">
        <div className="flex flex-col gap-4">

          {/* Points system */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 md:p-6 hover:border-[#2a2a2a] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-base">🎯</div>
              <h2 className="text-base md:text-lg font-black text-[#ff751f]">Σύστημα πόντων</h2>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Για κάθε παιχνίδι μοιράζονται 10 πόντοι ανάλογα με τις αποδόσεις. Όσο πιο απίθανο το αποτέλεσμα, τόσο περισσότεροι πόντοι.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[rgba(255,117,31,0.06)] border border-[rgba(255,117,31,0.15)] rounded-xl p-4">
                <div className="text-white font-bold mb-1 text-sm">Σωστή πρόβλεψη</div>
                <div className="text-[#ff751f] text-2xl md:text-3xl font-black">+2 έως +9</div>
                <div className="text-gray-600 text-xs mt-1">ανάλογα με την απόδοση</div>
              </div>
              <div className="bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.15)] rounded-xl p-4">
                <div className="text-white font-bold mb-1 text-sm">Λάθος πρόβλεψη</div>
                <div className="text-red-400 text-2xl md:text-3xl font-black">-1</div>
                <div className="text-gray-600 text-xs mt-1">πόντος αφαίρεση</div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 md:p-6 hover:border-[#2a2a2a] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-base">🏅</div>
              <h2 className="text-base md:text-lg font-black text-[#ff751f]">Κατηγορίες παικτών</h2>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Οι παίκτες χωρίζονται σε 4 κατηγορίες ανάλογα με την κατάταξή τους:
            </p>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {[
                { label: "PLATINUM", range: "Κορυφαίο 25%", bg: "bg-[#1a1540]", text: "text-[#AFA9EC]", border: "border-[#AFA9EC]/20" },
                { label: "GOLD", range: "26% — 50%", bg: "bg-[#3a2e00]", text: "text-[#FAC775]", border: "border-[#FAC775]/20" },
                { label: "SILVER", range: "51% — 75%", bg: "bg-[#222]", text: "text-[#ccc]", border: "border-[#ccc]/10" },
                { label: "BRONZE", range: "76% — 100%", bg: "bg-[#2a1500]", text: "text-[#F0997B]", border: "border-[#F0997B]/20" },
              ].map((cat) => (
                <div key={cat.label} className={`${cat.bg} border ${cat.border} rounded-xl p-3.5 flex items-center gap-3`}>
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black ${cat.bg} ${cat.text} border ${cat.border} flex-shrink-0`}>{cat.label}</span>
                  <span className={`${cat.text} text-xs md:text-sm font-medium`}>{cat.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other sections */}
          {sections.map((s, i) => (
            <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 md:p-6 hover:border-[#2a2a2a] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[rgba(255,117,31,0.1)] border border-[rgba(255,117,31,0.2)] flex items-center justify-center text-base">{s.icon}</div>
                <h2 className="text-base md:text-lg font-black text-[#ff751f]">{s.title}</h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}