import Navbar from "@/components/Navbar";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
          <span className="text-[#ff751f] text-xs tracking-[3px]">EURODRAFT</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-medium mb-8 md:mb-10">Κανόνες</h1>

        <div className="flex flex-col gap-4 md:gap-6">

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Τι είναι το EuroDraft;</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Το EuroDraft είναι μια πλατφόρμα προβλέψεων για τα παιχνίδια της Euroleague. Κάθε αγωνιστική κάνεις τις προβλέψεις σου, μαζεύεις πόντους και ανεβαίνεις στην κατάταξη.
            </p>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Σύστημα πόντων</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Για κάθε παιχνίδι μοιράζονται 10 πόντοι ανάλογα με τις αποδόσεις. Όσο πιο απίθανο το αποτέλεσμα, τόσο περισσότεροι πόντοι.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
                <div className="text-white font-medium mb-1 text-sm md:text-base">Σωστή πρόβλεψη</div>
                <div className="text-[#ff751f] text-xl md:text-2xl font-medium">+2 έως +9</div>
                <div className="text-gray-500 text-xs mt-1">ανάλογα με την απόδοση</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3 md:p-4">
                <div className="text-white font-medium mb-1 text-sm md:text-base">Λάθος πρόβλεψη</div>
                <div className="text-red-400 text-xl md:text-2xl font-medium">-1</div>
                <div className="text-gray-500 text-xs mt-1">πόντος αφαίρεση</div>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Deadline προβλέψεων</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Κάθε αγωνιστική έχει ένα deadline — συνήθως λίγο πριν αρχίσει το πρώτο ματς. Μετά το deadline δεν μπορείς να αλλάξεις τις προβλέψεις σου.
            </p>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Κατηγορίες παικτών</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Οι παίκτες χωρίζονται σε 4 κατηγορίες ανάλογα με την κατάταξή τους:
            </p>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-[#1a1540] rounded-lg p-3 flex items-center gap-2 md:gap-3">
                <span className="text-[9px] px-2 py-0.5 rounded font-medium bg-[#1a1540] text-[#AFA9EC] border border-[#AFA9EC] flex-shrink-0">PLATINUM</span>
                <span className="text-[#AFA9EC] text-xs md:text-sm">Κορυφαίο 25%</span>
              </div>
              <div className="bg-[#3a2e00] rounded-lg p-3 flex items-center gap-2 md:gap-3">
                <span className="text-[9px] px-2 py-0.5 rounded font-medium bg-[#3a2e00] text-[#FAC775] border border-[#FAC775] flex-shrink-0">GOLD</span>
                <span className="text-[#FAC775] text-xs md:text-sm">26% - 50%</span>
              </div>
              <div className="bg-[#222] rounded-lg p-3 flex items-center gap-2 md:gap-3">
                <span className="text-[9px] px-2 py-0.5 rounded font-medium bg-[#222] text-[#ccc] border border-[#ccc] flex-shrink-0">SILVER</span>
                <span className="text-[#ccc] text-xs md:text-sm">51% - 75%</span>
              </div>
              <div className="bg-[#2a1500] rounded-lg p-3 flex items-center gap-2 md:gap-3">
                <span className="text-[9px] px-2 py-0.5 rounded font-medium bg-[#2a1500] text-[#F0997B] border border-[#F0997B] flex-shrink-0">BRONZE</span>
                <span className="text-[#F0997B] text-xs md:text-sm">76% - 100%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Εβδομαδιαία Challenges</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Κάθε αγωνιστική υπάρχει ένα ειδικό challenge με bonus πόντους. Π.χ. "Βρες 4 σωστά ειδικά παικτών και κέρδισε +10 πόντους". Επίσης, αν έχεις 100% στις προβλέψεις μιας αγωνιστικής, κερδίζεις +10 bonus πόντους!
            </p>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Κύπελλο</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Τις πρώτες 8 αγωνιστικές κάθε σεζόν κατατάσσουν τους παίκτες στις 4 κατηγορίες. Μετά ξεκινά μια παράλληλη knock-out διοργάνωση — το Κύπελλο — όπου οι παίκτες της ίδιας κατηγορίας παίζουν μεταξύ τους με κλήρωση.
            </p>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 md:p-6">
            <h2 className="text-base md:text-lg font-medium text-[#ff751f] mb-3">Ιδιωτικά πρωταθλήματα</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Μπορείς να φτιάξεις το δικό σου πρωτάθλημα με φίλους. Δημιούργησε ένα ιδιωτικό league, μοιράσου τον κωδικό και ανταγωνίσου με την παρέα σου παράλληλα με τη γενική κατάταξη.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}