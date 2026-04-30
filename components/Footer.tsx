import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t-2 border-[#ff751f] mt-auto" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">

          {/* Logo + disclaimer */}
          <div className="max-w-lg">
            <div className="mb-3">
  <img src="/logowhite_temp.png" alt="CourtProphet" className="h-10 w-10 object-contain" />
</div>
            <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
              Το CourtProphet δεν σχετίζεται με την EuroLeague Basketball ή οποιαδήποτε επίσημη αθλητική οργάνωση. Είναι μια ανεξάρτητη πλατφόρμα προβλέψεων αποκλειστικά για ψυχαγωγικούς σκοπούς. Δεν υπάρχει χρηματικό στοίχημα.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-0 border-2 border-white/10 overflow-hidden">
            {[
              { href: "/privacy", label: "Πολιτική Απορρήτου" },
              { href: "/terms", label: "Όροι Χρήσης" },
              { href: "/rules", label: "Κανόνες" },
            ].map((link, i) => (
              <Link key={link.href} href={link.href}
                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 border-b border-white/10 last:border-b-0 hover:bg-[#ff751f] hover:text-black transition-all">
                {link.label} →
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 mt-6 pt-4 flex items-center justify-between">
          <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
            © {new Date().getFullYear()} CourtProphet
          </span>
          <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>
            All rights reserved
          </span>
        </div>
      </div>
    </footer>
  );
}