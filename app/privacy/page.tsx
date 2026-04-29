import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  const sections = [
    { title: "01 — Εισαγωγή", content: "Το CourtProphet («εμείς», «μας») σέβεται την ιδιωτικότητά σου. Αυτή η πολιτική εξηγεί ποιες πληροφορίες συλλέγουμε, πώς τις χρησιμοποιούμε και ποια είναι τα δικαιώματά σου." },
    { title: "02 — Δεδομένα που συλλέγουμε", content: "Συλλέγουμε το email σου και το username που επιλέγεις κατά την εγγραφή. Επίσης αποθηκεύουμε τις προβλέψεις σου, τους πόντους σου και τα μηνύματα που στέλνεις στο chat." },
    { title: "03 — Χρήση δεδομένων", content: "Τα δεδομένα σου χρησιμοποιούνται αποκλειστικά για τη λειτουργία της πλατφόρμας CourtProphet. Δεν πουλάμε, δεν νοικιάζουμε και δεν μοιραζόμαστε τα δεδομένα σου με τρίτους." },
    { title: "04 — Cookies", content: "Χρησιμοποιούμε cookies και localStorage για να αποθηκεύουμε την κατάσταση σύνδεσής σου και τις προτιμήσεις σου. Μπορείς να απορρίψεις τα cookies, αλλά ορισμένες λειτουργίες ενδέχεται να μην λειτουργούν σωστά." },
    { title: "05 — Ασφάλεια", content: "Χρησιμοποιούμε Firebase Authentication και Firestore της Google για την ασφαλή αποθήκευση των δεδομένων σου. Όλες οι επικοινωνίες κρυπτογραφούνται μέσω HTTPS." },
    { title: "06 — Τα δικαιώματά σου", content: "Έχεις δικαίωμα πρόσβασης, διόρθωσης και διαγραφής των δεδομένων σου. Για οποιοδήποτε αίτημα επικοινώνησε μαζί μας στο courtprophet@gmail.com." },
    { title: "07 — Επικοινωνία", content: "Για ερωτήσεις σχετικά με την πολιτική απορρήτου, επικοινώνησε μαζί μας στο courtprophet@gmail.com." },
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
            ΑΠΟΡ<span className="text-[#ff751f]">ΡΗΤΟ</span>
          </h1>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-2 font-black" style={{ fontFamily: "Arial, sans-serif" }}>
            Τελευταία ενημέρωση: Απρίλιος 2026
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 flex flex-col gap-2">
        {sections.map((s, i) => (
          <div key={i} className="border-2 border-white/10 bg-black overflow-hidden">
            <div className={`px-4 py-2 ${i % 2 === 0 ? "bg-[#ff751f]" : "bg-white"}`}>
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