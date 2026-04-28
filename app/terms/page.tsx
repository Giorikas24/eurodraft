import Navbar from "@/components/Navbar";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#ff751f] opacity-[0.05] blur-[100px] rounded-full"></div>
        </div>
        <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-10 relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#ff751f]"></div>
            <span className="text-[#ff751f] text-xs tracking-[4px] font-medium">EURODRAFT</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Όροι Χρήσης</h1>
          <p className="text-gray-600 text-sm mt-2">Τελευταία ενημέρωση: Απρίλιος 2026</p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-5 md:px-10 py-8 flex flex-col gap-6">
        {[
          {
            title: "1. Αποδοχή Όρων",
            content: "Χρησιμοποιώντας το EuroDraft αποδέχεσαι πλήρως τους παρόντες όρους χρήσης. Αν δεν συμφωνείς, παρακαλούμε να μην χρησιμοποιείς την πλατφόρμα.",
          },
          {
            title: "2. Περιγραφή Υπηρεσίας",
            content: "Το EuroDraft είναι μια δωρεάν πλατφόρμα προβλέψεων για τα παιχνίδια της Euroleague. Δεν υπάρχει χρηματικό στοίχημα — οι πόντοι είναι αποκλειστικά για διασκέδαση και ανταγωνισμό.",
          },
          {
            title: "3. Εγγραφή Χρήστη",
            content: "Για να χρησιμοποιήσεις πλήρως την πλατφόρμα πρέπει να εγγραφείς. Είσαι υπεύθυνος για την ασφάλεια του λογαριασμού σου και για κάθε δραστηριότητα που γίνεται μέσω αυτού.",
          },
          {
            title: "4. Κανόνες Συμπεριφοράς",
            content: "Απαγορεύεται η χρήση προσβλητικής γλώσσας στο chat, η παραπλάνηση άλλων χρηστών και οποιαδήποτε προσπάθεια χειραγώγησης του συστήματος βαθμολογίας. Παραβιάσεις οδηγούν σε διαγραφή λογαριασμού.",
          },
          {
            title: "5. Πνευματικά Δικαιώματα",
            content: "Το περιεχόμενο, το λογότυπο και ο σχεδιασμός του EuroDraft ανήκουν αποκλειστικά στους δημιουργούς. Απαγορεύεται η αναπαραγωγή χωρίς γραπτή άδεια.",
          },
          {
            title: "6. Αποποίηση Ευθύνης",
            content: "Το EuroDraft παρέχεται «ως έχει» χωρίς εγγυήσεις. Δεν φέρουμε ευθύνη για τυχόν διακοπές της υπηρεσίας ή απώλεια δεδομένων.",
          },
          {
            title: "7. Τροποποιήσεις",
            content: "Διατηρούμε το δικαίωμα να τροποποιούμε τους παρόντες όρους οποιαδήποτε στιγμή. Οι αλλαγές τίθενται σε ισχύ άμεσα μετά τη δημοσίευσή τους.",
          },
          {
            title: "8. Επικοινωνία",
            content: "Για ερωτήσεις σχετικά με τους όρους χρήσης, επικοινώνησε μαζί μας στο eurodraft.app@gmail.com.",
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