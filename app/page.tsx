import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      
      <Navbar />

      {/* Hero */}
      <div className="bg-black border-b border-[#1a1a1a]">
        <div className="w-full max-w-7xl mx-auto px-10 py-16 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff751f]"></div>
            <span className="text-[#ff751f] text-xs tracking-[3px]">EUROLEAGUE PREDICTIONS</span>
          </div>
          <h1 className="text-6xl font-medium leading-tight mb-6">
            Πρόβλεψε.<br />Ανταγωνίσου.<br /><span className="text-[#ff751f]">Κέρδισε.</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-lg">
            Κάνε τις προβλέψεις σου για κάθε ματς της Euroleague, μάζεψε πόντους και ανέβα στην παγκόσμια κατάταξη.
          </p>
          <div className="flex gap-3 mb-14">
            <button className="bg-[#ff751f] text-black font-medium px-8 py-3.5 rounded-lg text-sm hover:bg-[#e6671a]">Ξεκίνα δωρεάν</button>
            <button className="border border-[#333] text-white px-8 py-3.5 rounded-lg text-sm hover:bg-[#111]">Πώς λειτουργεί</button>
          </div>
          <div className="flex gap-0">
            <div className="pr-10 mr-10 border-r border-[#1a1a1a]">
              <div className="text-3xl font-medium text-white">347</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΠΑΙΚΤΕΣ</div>
            </div>
            <div className="pr-10 mr-10 border-r border-[#1a1a1a]">
              <div className="text-3xl font-medium text-white">#28</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">ΑΓΩΝΙΣΤΙΚΗ</div>
            </div>
            <div>
              <div className="text-3xl font-medium text-white">2ω14λ</div>
              <div className="text-[10px] tracking-[2px] text-gray-600 mt-1">DEADLINE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="bg-[#ff751f]">
        <div className="w-full max-w-7xl mx-auto px-10 py-2.5 flex gap-8">
          {[
            { teams: "ΟΛΥ · VIL", info: "Παρ 20:00 · LIVE" },
            { teams: "BAR · RMA", info: "Παρ 21:00" },
            { teams: "PAN · CSK", info: "Σαβ 20:30" },
            { teams: "EFE · MAD", info: "Σαβ 21:00" },
            { teams: "ASV · ZAL", info: "Κυρ 19:00" },
            { teams: "BAY · MCO", info: "Κυρ 20:00" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-medium text-black">{item.teams}</span>
              <span className="text-xs text-black/60">{item.info}</span>
              {i < 5 && <span className="text-black/30 ml-4">·</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Games section */}
      <div className="w-full max-w-7xl mx-auto px-10 py-8">
        <div className="flex justify-between items-center mb-5">
          <div>
            <span className="text-base font-medium">Αγωνιστική #28</span>
            <span className="text-xs text-gray-500 ml-3">Deadline: Παρασκευή 18:00 · Επέλεξες 3/8</span>
          </div>
          <span className="text-xs text-[#ff751f] cursor-pointer">Δες όλα →</span>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { time: "Παρ 20:00", live: true, h: "Ολυμπιακός", a: "Βιλερμπάν", hpts: "+2", apts: "+8", hpct: "63%", apct: "37%", sel: "h" },
            { time: "Παρ 21:00", live: false, h: "Μπαρτσελόνα", a: "Ρεάλ Μαδρίτης", hpts: "+5", apts: "+5", hpct: "51%", apct: "49%", sel: null },
            { time: "Σαβ 20:30", live: false, h: "Παναθηναϊκός", a: "ΤΣΣΚΑ", hpts: "+4", apts: "+6", hpct: "58%", apct: "42%", sel: "h" },
            { time: "Σαβ 21:00", live: false, h: "Εφές", a: "Μακάμπι", hpts: "+6", apts: "+4", hpct: "44%", apct: "56%", sel: null },
          ].map((g, i) => (
            <div key={i} className="bg-[#111] rounded-xl border border-[#1e1e1e] px-5 py-3.5 grid grid-cols-[110px_1fr_320px_70px] items-center gap-4 hover:border-[#2a2a2a]">
              <div>
                <div className="text-xs text-gray-400">{g.time}</div>
                {g.live && <span className="text-[10px] bg-[#ff751f] text-black px-2 py-0.5 rounded font-medium mt-1 inline-block">LIVE</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{g.h}</span>
                <span className="text-xs text-gray-600">vs</span>
                <span className="text-sm font-medium">{g.a}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer ${g.sel === "h" ? "bg-[rgba(255,117,31,0.08)] border border-[#ff751f]" : "bg-[#1a1a1a] border border-[#222]"}`}>
                  <span className="text-xs font-medium">{g.h}</span>
                  <span className="text-xs text-[#ff751f] font-medium">{g.hpts}</span>
                </div>
                <div className={`rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer ${g.sel === "a" ? "bg-[rgba(255,117,31,0.08)] border border-[#ff751f]" : "bg-[#1a1a1a] border border-[#222]"}`}>
                  <span className="text-xs font-medium">{g.a}</span>
                  <span className="text-xs text-[#ff751f] font-medium">{g.apts}</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 text-right">{g.hpct} / {g.apct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom widgets */}
      <div className="w-full max-w-7xl mx-auto px-10 pb-10 grid grid-cols-3 gap-3">
        {/* Leaderboard */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-[2px] text-gray-600">ΓΕΝΙΚΗ ΚΑΤΑΤΑΞΗ</span>
            <span className="text-xs text-[#ff751f] cursor-pointer">Δες όλους →</span>
          </div>
          {[
            { n: 1, name: "Νίκος Κ.", badge: "PLAT", pts: 284, badgeClass: "bg-[#1a1540] text-[#AFA9EC]" },
            { n: 2, name: "Γιώργης Π.", badge: "GOLD", pts: 271, badgeClass: "bg-[#3a2e00] text-[#FAC775]" },
            { n: 3, name: "Αλέξης Μ.", badge: "GOLD", pts: 259, badgeClass: "bg-[#3a2e00] text-[#FAC775]" },
            { n: 4, name: "Δημήτρης Λ.", badge: "SILVER", pts: 241, badgeClass: "bg-[#222] text-[#ccc]" },
            { n: 5, name: "Κώστας Θ.", badge: "SILVER", pts: 238, badgeClass: "bg-[#222] text-[#ccc]" },
          ].map((r) => (
            <div key={r.n} className="flex items-center gap-2 py-2 border-b border-[#1a1a1a] last:border-0">
              <span className={`text-xs w-5 text-center ${r.n <= 3 ? "text-[#ff751f]" : "text-gray-600"}`}>{r.n}</span>
              <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[9px] text-white font-medium">{r.name.split(" ").map((w: string) => w[0]).join("")}</div>
              <span className="text-xs text-white flex-1">{r.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${r.badgeClass}`}>{r.badge}</span>
              <span className="text-xs font-medium text-white ml-1">{r.pts}</span>
            </div>
          ))}
        </div>

        {/* My position */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-[2px] text-gray-600">Η ΘΕΣΗ ΜΟΥ</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-[#2a1500] text-[#F0997B]">BRONZE</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-medium">#23</span>
            <div>
              <div className="text-sm font-medium">Username</div>
              <div className="text-xs text-gray-500">183 πόντοι συνολικά</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "6/8", label: "Σωστές", orange: false },
              { val: "+12", label: "Θέσεις", orange: true },
              { val: "68%", label: "Επιτυχία", orange: false },
              { val: "3/8", label: "Επιλογές", orange: true },
            ].map((s, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-lg p-2.5 text-center">
                <div className={`text-lg font-medium ${s.orange ? "text-[#ff751f]" : "text-white"}`}>{s.val}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-5">
          <div className="text-[10px] tracking-[2px] text-gray-600 mb-4">ΕΒΔΟΜΑΔΙΑΙΟ CHALLENGE</div>
          <div className="bg-[rgba(255,117,31,0.06)] border border-[rgba(255,117,31,0.2)] rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-[#ff751f] mb-1">+10 bonus πόντοι</div>
            <div className="text-xs text-gray-400 leading-relaxed">Βρες 4 σωστά ειδικά παικτών αυτή την αγωνιστική</div>
          </div>
          <div className="text-xs text-gray-400 mb-2">Πρόοδος: 2/4 ειδικά</div>
          <div className="h-1 bg-[#1a1a1a] rounded-full">
            <div className="h-1 bg-[#ff751f] rounded-full w-1/2"></div>
          </div>
        </div>
      </div>
    </main>
  );
}