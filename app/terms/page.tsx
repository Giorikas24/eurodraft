import Navbar from "@/components/Navbar";

export default function TermsPage() {
  const sections = [
    { title: "01 — Αποδοχή Όρων", content: "Χρησιμοποιώντας το CourtProphet αποδέχεσαι πλήρως τους παρόντες όρους χρήσης. Αν δεν συμφωνείς, παρακαλούμε να μην χρησιμοποιείς την πλατφόρμα." },
    { title: "02 — Περιγραφή Υπηρεσίας", content: "Το CourtProphet είναι μια δωρεάν πλατφόρμα προβλέψεων για τα παιχνίδια της Euroleague. Δεν υπάρχει χρηματικό στοίχημα — οι πόντοι είναι αποκλειστικά για διασκέδαση και ανταγωνισμό." },
    { title: "03 — Εγγραφή Χρήστη", content: "Για να χρησιμοποιήσεις πλήρως την πλατφόρμα πρέπει να εγγραφείς. Είσαι υπεύθυνος για την ασφάλεια του λογαριασμού σου και για κάθε δραστηριότητα που γίνεται μέσω αυτού." },
    { title: "04 — Κανόνες Συμπεριφοράς", content: "Απαγορεύεται η χρήση προσβλητικής γλώσσας στο chat, η παραπλάνηση άλλων χρηστών και οποιαδήποτε προσπάθεια χειραγώγησης του συστήματος βαθμολογίας. Παραβιάσεις οδηγούν σε διαγραφή λογαριασμού." },
    { title: "05 — Πνευματικά Δικαιώματα", content: "Το περιεχόμενο, το λογότυπο και ο σχεδιασμός του CourtProphet ανήκουν αποκλειστικά στους δημιουργούς. Απαγορεύεται η αναπαραγωγή χωρίς γραπτή άδεια." },
    { title: "06 — Αποποίηση Ευθύνης", content: "Το CourtProphet παρέχεται «ως έχει» χωρίς εγγυήσεις. Δεν φέρουμε ευθύνη για τυχόν διακοπές της υπηρεσίας ή απώλεια δεδομένων. Το CourtProphet δεν σχετίζεται με την EuroLeague Basketball ή οποιαδήποτε επίσημη αθλητική οργάνωση." },
    { title: "07 — Τροποποιήσεις", content: "Διατηρούμε το δικαίωμα να τροποποιούμε τους παρόντες όρους οποιαδήποτε στιγμή. Οι αλλαγές τίθενται σε ισχύ άμεσα μετά τη δημοσίευσή τους." },
    { title: "08 — Επικοινωνία", content: "Για ερωτήσεις σχετικά με τους όρους χρήσης, επικοινώνησε μαζί μας στο courtprophet@gmail.com." },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <Navbar />

      <div className="bg-black border-b-2 border-[#ff751f]">
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8">
          <div className="flex items-center gap-0 mb-3">
            <div className="bg-[#ff751f] px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">CourtProphet</span>
            </div>
            <div className="bg-white px-3 py-1">
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">Legal</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-none tracking-tighter">
            ΟΡΟΙ <span className="text-[#ff751f]">ΧΡΗΣΗΣ</span>
          </h1>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-2 font-black" style={{ fontFamily: "Arial, sans-serif" }}>
            Τελευταία ενημέρωση: Απρίλιος 2026
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 flex flex-col gap-2">
        {sections.map((s, i) => (
          <div key={i} className="border-2 border-white/10 bg-black overflow-hidden">
            <div className={`px-4 py-2 ${i % 2 === 0 ? "bg-white" : "bg-[#ff751f]"}`}>
              <span className="text-black text-[9px] font-black tracking-[4px] uppercase">{s.title}</span>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>{s.content}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}