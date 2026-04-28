import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-[#1a1a1a] mt-auto">
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

          {/* Logo + disclaimer */}
          <div className="max-w-lg">
            <div className="font-bold text-xl tracking-widest mb-2">
              <span className="text-[#ff751f]">COURT</span>
              <span className="text-white">PROPHET</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Το CourtProphet δεν σχετίζεται με την EuroLeague Basketball ή οποιαδήποτε επίσημη αθλητική οργάνωση. Είναι μια ανεξάρτητη πλατφόρμα προβλέψεων αποκλειστικά για ψυχαγωγικούς σκοπούς. Δεν υπάρχει χρηματικό στοίχημα.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2 text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-[#ff751f] transition-colors">Πολιτική Απορρήτου</Link>
            <Link href="/terms" className="hover:text-[#ff751f] transition-colors">Όροι Χρήσης</Link>
            <Link href="/rules" className="hover:text-[#ff751f] transition-colors">Κανόνες</Link>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] mt-6 pt-6 text-center text-xs text-gray-700">
          © {new Date().getFullYear()} CourtProphet. Όλα τα δικαιώματα διατηρούνται.
        </div>
      </div>
    </footer>
  );
}