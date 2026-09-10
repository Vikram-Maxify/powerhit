import { useMemo } from "react";
import { FaBolt } from "react-icons/fa";
import { Link } from "react-router-dom";

// ---- Seeded PRNG so result stays same for the WHOLE day, but changes daily ----
// mulberry32: fast, deterministic PRNG from a numeric seed
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert any string (drawId + date) into a numeric seed
function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// yyyy-mm-dd key for "today" -> same seed all day, new seed next day
function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Pick N unique 2-digit numbers between min-max using the seeded rng
function pickUniqueNumbers(rng, count, min, max) {
  const nums = new Set();
  while (nums.size < count) {
    const n = Math.floor(rng() * (max - min + 1)) + min;
    nums.add(n);
  }
  return [...nums].sort((a, b) => a - b).map((n) => String(n).padStart(2, "0"));
}

// Random time of day (00:00 - 23:59), fixed for the day via seeded rng
function pickRandomTime(rng) {
  const hour24 = Math.floor(rng() * 24);
  const minute = Math.floor(rng() * 60);
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    hour: hour12,
    minute,
    period,
  };
}

// Format today's real date + the seeded random time, e.g. "10 Sep 2026, 02:30 PM"
function formatDrawDate(rng) {
  const now = new Date();
  const day = now.getDate();
  const monthShort = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  const { hour, minute, period } = pickRandomTime(rng);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${day} ${monthShort} ${year}, ${hh}:${mm} ${period}`;
}

// Draw definitions (id stays fixed so each market gets its own independent seed)
const POWERBALL_MARKETS = [
  {
    id: "aus-powerball",
    title: "AUSTRALIA POWERBALL",
    drawNo: "1423",
    bonusColor: "bg-purple-700",
    ballMin: 1,
    ballMax: 35,
    ballCount: 5,
    bonusMin: 1,
    bonusMax: 20,
  },
  {
    id: "usa-powerball",
    title: "USA POWERBALL",
    drawNo: "1598",
    bonusColor: "bg-red-700",
    ballMin: 1,
    ballMax: 69,
    ballCount: 5,
    bonusMin: 1,
    bonusMax: 26,
  },
];

const PowerballPublicResult = () => {
  // Recomputed only when the date changes (new day -> new seed -> new result)
  const todayKey = getTodayKey();

  const draws = useMemo(() => {
    return POWERBALL_MARKETS.map((market) => {
      // Seed = market id + today's date -> same result all day, different every day, independent per market
      const seed = stringToSeed(`${market.id}-${todayKey}`);
      const rng = mulberry32(seed);

      const balls = pickUniqueNumbers(
        rng,
        market.ballCount,
        market.ballMin,
        market.ballMax,
      );
      const bonus = String(
        Math.floor(rng() * (market.bonusMax - market.bonusMin + 1)) +
          market.bonusMin,
      ).padStart(2, "0");
      const date = formatDrawDate(rng);

      return {
        id: market.id,
        title: market.title,
        drawNo: market.drawNo,
        balls,
        bonus,
        bonusColor: market.bonusColor,
        date,
      };
    });
  }, [todayKey]);

  return (
    <>
      {/* Powerball Header */}
      <div className="px-4 pt-3 pb-4 border-t border-gray-100 mt-2">
        <div className="flex items-start justify-between mb-3 mt-3">
          <div className="flex items-start gap-2">
            <FaBolt className="text-amber-500 text-lg mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                POWERBALL RESULTS
              </h3>
              <p className="text-[11px] text-gray-400 leading-tight">
                International Powerball Live Results
              </p>
            </div>
          </div>
          <Link
            to={"/powerball/result"}
            className="text-[11px] font-bold text-black px-3 py-1.5 rounded-lg shrink-0
  bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
  border border-[#FFD75A]
  shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
          >
            View All
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
        {draws.map((draw) => (
          <div
            key={draw.id}
            className="border border-gray-100 rounded-xl px-1 py-3 text-center"
          >
            <p className="text-xs font-bold text-gray-800">{draw.title}</p>
            <p className="text-[10px] text-gray-400 mb-2">
              Draw #{draw.drawNo}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {draw.balls.map((b, idx) => (
                <span
                  key={idx}
                  className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[11px] font-bold text-gray-800"
                >
                  {b}
                </span>
              ))}
              <span
                className={`w-7 h-7 rounded-full ${draw.bonusColor} shadow-sm flex items-center justify-center text-[11px] font-bold text-white`}
              >
                {draw.bonus}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
              <span>{draw.date}</span>
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                LIVE
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PowerballPublicResult;
