import { FaBolt } from "react-icons/fa";
import { Link } from "react-router-dom";

const PowerballPublicResult = () => {
  // ---- Mock data for Powerball (replace with real API later) ----
  const POWERBALL_MOCK = [
    {
      id: "aus-1423",
      title: "AUSTRALIA POWERBALL",
      drawNo: "1423",
      balls: ["12", "23", "31", "36", "44"],
      bonus: "7",
      bonusColor: "bg-purple-700",
      date: "10 Aug 2026, 02:30 PM",
    },
    {
      id: "usa-1598",
      title: "USA POWERBALL",
      drawNo: "1598",
      balls: ["05", "18", "27", "40", "53"],
      bonus: "19",
      bonusColor: "bg-red-700",
      date: "10 Aug 2026, 05:59 AM",
    },
  ];
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
        {POWERBALL_MOCK.map((draw) => (
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
