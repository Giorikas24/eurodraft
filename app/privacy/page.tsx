import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#ff751f] opacity-[0.05] blur-[100px] rounded-full"></div>
        </div>
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-10 relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#ff751f] animate-pulse shadow-[0_0_8px_rgba(255,117,31,0.8)]"></div>
            <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">COURTPROPHET</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Πολιτική Απορρήτου</h1>
          <p className="text-gray-600 text-sm mt-2">Τελευταία ενημέρωση: Απρίλιος 2026</p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 flex flex-col gap-6">
        {[
          {
            title: "1. Εισαγωγή",
            content: "Το CourtProphet («εμείς», «μας») σέβεται την ιδιωτικότητά σου. Αυτή η πολιτική εξηγεί ποιες πληροφορίες συλλέγουμε, πώς τις χρησιμοποιούμε και ποια είναι τα δικαιώματά σου.",
          },
          {
            title: "2. Δεδομένα που συλλέγουμε",
            content: "Συλλέγουμε το email σου και το username που επιλέγεις κατά την εγγραφή. Επίσης αποθηκεύουμε τις προβλέψεις σου, τους πόντους σου και τα μηνύματα που στέλνεις στο chat.",
          },
          {
            title: "3. Χρήση δεδομένων",
            content: "Τα δεδομένα σου χρησιμοποιούνται αποκλειστικά για τη λειτουργία της πλατφόρμας CourtProphet. Δεν πουλάμε, δεν νοικιάζουμε και δεν μοιραζόμαστε τα δεδομένα σου με τρίτους.",
          },
          {
            title: "4. Cookies",
            content: "Χρησιμοποιούμε cookies και localStorage για να αποθηκεύουμε την κατάσταση σύνδεσής σου και τις προτιμήσεις σου. Μπορείς να απορρίψεις τα cookies, αλλά ορισμένες λειτουργίες ενδέχεται να μην λειτουργούν σωστά.",
          },
          {
            title: "5. Ασφάλεια",
            content: "Χρησιμοποιούμε Firebase Authentication και Firestore της Google για την ασφαλή αποθήκευση των δεδομένων σου. Όλες οι επικοινωνίες κρυπτογραφούνται μέσω HTTPS.",
          },
          {
            title: "6. Τα δικαιώματά σου",
            content: "Έχεις δικαίωμα πρόσβασης, διόρθωσης και διαγραφής των δεδομένων σου. Για οποιοδήποτε αίτημα επικοινώνησε μαζί μας στο courtprophet@gmail.com.",
          },
          {
            title: "7. Επικοινωνία",
            content: "Για ερωτήσεις σχετικά με την πολιτική απορρήτου, επικοινώνησε μαζί μας στο courtprophet@gmail.com.",
          },
        ].map((s, i) => (
          <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all">
            <h2 className="text-base font-black text-[#ff751f] mb-3">{s.title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}