import { Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---- TOP 3 config ----
const initialTop3 = [
  { rank: 1, name: "Rahul K.", amount: "₹12,50,000", avatar: 0 },
  { rank: 2, name: "Alex M.", amount: "₹8,20,000", avatar: 2 },
  { rank: 3, name: "Suman P.", amount: "₹5,60,000", avatar: 4 },
];

const top3NamePool = [
  "Rahul K.",
  "Alex M.",
  "Suman P.",
  "Vikram S.",
  "Neha J.",
  "Carlos R.",
  "Priya M.",
  "Tom W.",
  "Sana K.",
  "Arjun B.",
  "Emily T.",
  "Farhan A.",
  "Divya N.",
  "Michael O.",
  "Kavya R.",
];

// your 6 avatar images
const avatarPool = [
  "https://i.ibb.co/RT5RVHv9/one.png",
  "https://i.ibb.co/RTgWNDJN/two.png",
  "https://i.ibb.co/1tdr9Bvj/three.png",
  "https://i.ibb.co/xSSX8M8G/four.png",
  "https://i.ibb.co/p6zrKs2q/five.png",
  "https://i.ibb.co/jPXPPMfc/six.png",
];

// ---- 4-10 RANK config ----
const namePool = [
  "John D.",
  "Amit S.",
  "Peter K.",
  "Ram C.",
  "David L.",
  "Ali R.",
  "Mohan T.",
  "Vikram S.",
  "Neha J.",
  "Carlos R.",
  "Priya M.",
  "Tom W.",
  "Sana K.",
  "Arjun B.",
  "Emily T.",
  "Farhan A.",
  "Divya N.",
  "Michael O.",
  "Kavya R.",
  "Rohit V.",
  "Lisa C.",
  "Imran H.",
  "Ananya D.",
  "Steve P.",
  "Zoya F.",
  "Karan G.",
  "Meera S.",
  "Daniel K.",
  "Pooja L.",
  "Yusuf M.",
];

// Backing pool of 30 candidate winners (data stays 30, only 7 shown at a time)
const winnersPool = Array.from({ length: 30 }, (_, i) => {
  const base = 320000 - i * 7000 + Math.round(Math.random() * 4000);
  return { id: i, name: namePool[i % namePool.length], amount: base };
});

// initial 7 visible slots (rank 4-10) picked from the pool
const initialVisible = winnersPool.slice(0, 7).map((w, i) => ({
  rank: i + 4,
  poolId: w.id,
  name: w.name,
  amount: w.amount,
}));

const formatINR = (num) => "₹" + Math.round(num).toLocaleString("en-IN");

const rankBadgeStyle = {
  1: "bg-yellow-400 text-white",
  2: "bg-gray-300 text-white",
  3: "bg-orange-400 text-white",
};

export default function TopWinners() {
  const [top3, setTop3] = useState(initialTop3);
  const [winners, setWinners] = useState(initialVisible);
  const [highlightRank, setHighlightRank] = useState(null);
  const [highlightTop3Rank, setHighlightTop3Rank] = useState(null);

  const usedTop3Names = useRef(new Set(initialTop3.map((w) => w.name)));
  const usedTop3Avatars = useRef(new Set(initialTop3.map((w) => w.avatar)));
  const usedNames = useRef(new Set(initialVisible.map((w) => w.name)));

  // --- rotate top 3: name + avatar (from the 6 images) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTop3((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const current = prev[idx];

        let nameCandidates = top3NamePool.filter(
          (n) => !usedTop3Names.current.has(n),
        );
        if (nameCandidates.length === 0) nameCandidates = top3NamePool;
        const newName =
          nameCandidates[Math.floor(Math.random() * nameCandidates.length)];

        let avatarCandidates = avatarPool
          .map((_, i) => i)
          .filter((i) => !usedTop3Avatars.current.has(i));
        if (avatarCandidates.length === 0)
          avatarCandidates = avatarPool.map((_, i) => i);
        const newAvatarIdx =
          avatarCandidates[Math.floor(Math.random() * avatarCandidates.length)];

        usedTop3Names.current.delete(current.name);
        usedTop3Names.current.add(newName);
        usedTop3Avatars.current.delete(current.avatar);
        usedTop3Avatars.current.add(newAvatarIdx);

        const baseAmount = parseInt(current.amount.replace(/[₹,]/g, ""), 10);
        const jitter = Math.round(baseAmount * (0.97 + Math.random() * 0.04));

        const updated = [...prev];
        updated[idx] = {
          ...current,
          name: newName,
          avatar: newAvatarIdx,
          amount: formatINR(jitter),
        };

        setHighlightTop3Rank(updated[idx].rank);
        setTimeout(() => setHighlightTop3Rank(null), 900);

        return updated;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // --- rotate 4-10 visible slots: swap one visible slot with an unused pool member ---
  useEffect(() => {
    const interval = setInterval(() => {
      setWinners((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const current = prev[idx];

        // pick a pool member not currently visible
        const visibleIds = new Set(prev.map((w) => w.poolId));
        const candidates = winnersPool.filter((w) => !visibleIds.has(w.id));
        const pick = candidates.length
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : winnersPool[Math.floor(Math.random() * winnersPool.length)];

        const jitter = Math.round(pick.amount * (0.95 + Math.random() * 0.08));

        usedNames.current.delete(current.name);
        usedNames.current.add(pick.name);

        const updated = [...prev];
        updated[idx] = {
          ...current,
          poolId: pick.id,
          name: pick.name,
          amount: jitter,
        };

        setHighlightRank(updated[idx].rank);
        setTimeout(() => setHighlightRank(null), 900);

        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-5 bg-gray-50">
      <style>{`
        @keyframes rowFlash {
          0% { background-color: rgba(251, 191, 36, 0.35); transform: scale(1.015); }
          100% { background-color: transparent; transform: scale(1); }
        }
        .row-flash { animation: rowFlash 0.9s ease-out; border-radius: 8px; }

        @keyframes fadeSwap {
          0% { opacity: 0; transform: translateY(-3px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-swap { animation: fadeSwap 0.4s ease-out; }

        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .live-dot { animation: livePulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <h2 className="text-[15px] font-extrabold text-gray-900 tracking-wide uppercase">
            Top Winners
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
          <span className="text-[10px] font-semibold text-gray-500 tracking-wide">
            LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Top 3 Winners panel */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="text-center py-2 px-1 border-b border-gray-100">
            <span className="text-orange-500 font-bold text-[10px] sm:text-[11px] tracking-wide">
              TOP 3 WINNERS
            </span>
          </div>
          <div className="px-2.5 py-2.5 space-y-5">
            {top3.map((w) => (
              <div
                key={w.rank}
                className={`flex items-center gap-1.5 px-1 py-0.5 -mx-1 ${
                  highlightTop3Rank === w.rank ? "row-flash" : ""
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${rankBadgeStyle[w.rank]}`}
                >
                  {w.rank}
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <img
                    key={w.avatar}
                    src={avatarPool[w.avatar]}
                    alt={w.name}
                    loading="lazy"
                    className="w-full h-full object-cover fade-swap"
                  />
                </div>
                <span
                  key={w.name}
                  className="flex-1 min-w-0 text-gray-800 font-semibold text-[11px] truncate fade-swap"
                >
                  {w.name}
                </span>
                <span
                  key={w.amount}
                  className="text-orange-500 font-bold text-[10px] sm:text-[11px] whitespace-nowrap fade-swap"
                >
                  {w.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4-10 Rank Winners panel (only 7 rows, backed by pool of 30) */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="text-center py-2 px-1 border-b border-gray-100">
            <span className="text-orange-500 font-bold text-[10px] sm:text-[11px] tracking-wide">
              4 - 10 RANK WINNERS
            </span>
          </div>
          <div className="px-2.5 py-2 space-y-1.5">
            {winners.map((w) => (
              <div
                key={w.rank}
                className={`flex items-center gap-1 px-1 py-0.5 -mx-1 ${
                  highlightRank === w.rank ? "row-flash" : ""
                }`}
              >
                <span className="w-3 text-gray-500 text-[10px] sm:text-[11px] font-medium flex-shrink-0">
                  {w.rank}
                </span>
                <span
                  key={w.name}
                  className="flex-1 min-w-0 text-gray-800 font-medium text-[11px] truncate fade-swap"
                >
                  {w.name}
                </span>
                <span
                  key={w.amount}
                  className="text-gray-700 font-semibold text-[10px] sm:text-[11px] whitespace-nowrap fade-swap"
                >
                  {formatINR(w.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
