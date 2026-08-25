import {
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  History,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const PowerballResults = () => {
  const [selectedCountry, setSelectedCountry] = useState("Australia");

  const countries = [
    { name: "Australia", flag: "🇦🇺" },
    { name: "USA", flag: "🇺🇸" },
    { name: "UK", flag: "🇬🇧" },
    { name: "Canada", flag: "🇨🇦" },
    { name: "South Africa", flag: "🇿🇦" },
  ];

  const latestResult = {
    drawNo: "#1423",
    date: "10 Aug 2026",
    time: "02:30 PM",
    numbers: [12, 23, 31, 36, 44],
    powerball: 7,
    nextDraw: "12 Aug 2026, 02:30 PM",
    jackpot: "AUD 20 MILLION",
  };

  const previousResults = [
    {
      draw: "#1422",
      date: "08 Aug 2026",
      numbers: [5, 18, 27, 40, 53],
      pb: 19,
      jackpot: "AUD 15M",
    },
    {
      draw: "#1421",
      date: "07 Aug 2026",
      numbers: [14, 21, 29, 33, 41],
      pb: 3,
      jackpot: "AUD 10M",
    },
    {
      draw: "#1420",
      date: "05 Aug 2026",
      numbers: [2, 11, 24, 37, 42],
      pb: 17,
      jackpot: "AUD 8M",
    },
    {
      draw: "#1419",
      date: "03 Aug 2026",
      numbers: [8, 19, 22, 35, 48],
      pb: 9,
      jackpot: "AUD 12M",
    },
    {
      draw: "#1418",
      date: "01 Aug 2026",
      numbers: [16, 20, 28, 30, 45],
      pb: 6,
      jackpot: "AUD 7M",
    },
  ];

  return (
    <div className="pb-10">
      {/* ===== TOP BANNER ===== */}
      <div className="relative h-[50px] w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-8">
          <div className="flex items-center gap-3"></div>
          <div className="mt-1.5">
            <h2 className="text-sm font-extrabold text-black">
              POWERBALL RESULTS
            </h2>
            <p className="text-[10px] text-gray-700/80">
              International Powerball Live Results
            </p>
          </div>
        </div>
      </div>

      {/* ===== COUNTRY TABS ===== */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {countries.map((country) => (
          <button
            key={country.name}
            onClick={() => setSelectedCountry(country.name)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCountry === country.name
                ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{country.flag}</span>
            <span>{country.name}</span>
          </button>
        ))}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* ===== LATEST RESULT ===== */}
        <div
          className="relative rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1655159428752-c700435e9983?q=80&w=3732&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark Overlay for readability */}
          {/* <div className="absolute inset-0 bg-gradient-to-br from-amber-950/85 via-amber-900/75 to-amber-800/70"></div> */}

          {/* Content */}
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-300" />
                <span className="text-xs font-bold text-amber-100">
                  LATEST POWERBALL RESULT
                </span>
              </div>
              <span className="text-[8px] font-bold text-green-300 bg-green-900/40 px-2.5 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                LIVE
              </span>
            </div>

            <div className="border-t border-amber-700/40 pt-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>
                  {countries.find((c) => c.name === selectedCountry)?.flag}
                </span>
                {selectedCountry} POWERBALL
              </h3>
              <div className="flex items-center gap-3 text-xs text-amber-200/80 mt-0.5">
                <span className="font-bold text-amber-300">
                  {latestResult.drawNo}
                </span>
                <span className="w-px h-3 bg-amber-700/50"></span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-amber-300" />
                  {latestResult.date}
                </span>
                <span className="w-px h-3 bg-amber-700/50"></span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-amber-300" />
                  {latestResult.time}
                </span>
              </div>
            </div>

            {/* Numbers */}
            <div className="flex items-center gap-3 py-3 px-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 mt-3">
              <div className="flex items-center gap-2">
                {latestResult.numbers.map((num, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-amber-500/30"
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-200/60 font-bold">|</span>
                <span className="text-[10px] text-amber-200/80 font-medium">
                  Powerball
                </span>
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-red-500/30">
                  {latestResult.powerball}
                </div>
              </div>
            </div>

            {/* Next Draw & Jackpot */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <p className="text-[8px] font-bold text-amber-300/80 uppercase tracking-wider">
                  NEXT DRAW
                </p>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-300" />
                  {latestResult.nextDraw}
                </p>
              </div>
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-amber-400/30">
                <p className="text-[8px] font-bold text-amber-300/80 uppercase tracking-wider">
                  EST. JACKPOT
                </p>
                <p className="text-sm font-extrabold text-amber-200">
                  {latestResult.jackpot}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ANALYSIS & SCHEDULE ===== */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/powerball/analysis"
            className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm hover:border-amber-300 transition group"
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-700">
                RESULT ANALYSIS
              </span>
            </div>
            <ChevronRight
              size={14}
              className="text-gray-300 group-hover:text-amber-500 transition"
            />
          </Link>
          <Link
            to="/powerball/schedule"
            className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm hover:border-amber-300 transition group"
          >
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-700">
                DRAWN SCHEDULE
              </span>
            </div>
            <ChevronRight
              size={14}
              className="text-gray-300 group-hover:text-amber-500 transition"
            />
          </Link>
        </div>

        {/* ===== PREVIOUS RESULTS - Clean & No Scroll ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-bold text-gray-600 flex items-center gap-2">
              <History size={14} className="text-amber-500" />
              PREVIOUS RESULTS
            </h3>
          </div>

          {/* Table - Clean & Compact (No Scroll) */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    DRAW NO.
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    DATE
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    WINNING NUMBERS
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    PB
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    JACKPOT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previousResults.map((result, i) => (
                  <tr
                    key={i}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-bold text-amber-600 text-[10px] whitespace-nowrap">
                      {result.draw}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-[10px] whitespace-nowrap">
                      {result.date}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {result.numbers.map((n, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex items-center justify-center text-white font-extrabold text-[8px] shadow-sm flex-shrink-0"
                          >
                            {String(n).padStart(2, "0")}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-extrabold text-[8px] shadow-sm flex-shrink-0">
                        {result.pb}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-bold text-green-600 text-[10px] whitespace-nowrap">
                      {result.jackpot}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== BOTTOM CTA ===== */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl px-5 py-3 flex items-center justify-between shadow-lg shadow-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <DollarSign size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-300" />
                PLAY BIG, WIN BIG!
              </p>
              <p className="text-amber-200/80 text-[9px]">
                Play Powerball & Win Life Changing Prizes
              </p>
            </div>
          </div>
          <Link
            to="/powerball/play"
            className="flex items-center gap-1.5 px-5 py-2 bg-white text-amber-600 font-bold rounded-lg text-xs shadow hover:shadow-lg transition flex-shrink-0"
          >
            <Play size={14} />
            PLAY NOW
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PowerballResults;
