import { Shield, Trophy } from "lucide-react";

const rechargeLevels = [
  {
    level: 1,
    title: "1st Level (Direct)",
    desc: "Get 5% of your friend's first recharge",
    percent: "5%",
  },
  {
    level: 2,
    title: "2nd Level",
    desc: "Get 2% of your friend's first recharge",
    percent: "2%",
  },
  {
    level: 3,
    title: "3rd Level",
    desc: "Get 1% of your friend's first recharge",
    percent: "1%",
  },
];

const notes = [
  "Bonus will be added automatically to your wallet.",
  "Only first recharge of your referred friend is valid.",
  "Betting bonus is calculated on net commission.",
  "Promo rules are subject to change without notice.",
];

const HowToEarn = () => {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-amber-500 tracking-wide">
        HOW TO EARN?
      </h2>

      {/* 3 Level Recharge Bonus */}
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-amber-500 tracking-wide mb-4">
          3 LEVEL FIRST RECHARGE BONUS
        </h3>

        <div className="divide-y divide-gray-100">
          {rechargeLevels.map((item) => (
            <div key={item.level} className="flex items-center gap-3 py-3.5">
              <div className="relative w-11 h-11 flex-shrink-0">
                <Shield
                  size={44}
                  className="text-amber-400"
                  fill="currentColor"
                />
                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-black">
                  {item.level}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 leading-snug">
                  {item.desc}
                </p>
              </div>

              <span className="text-sm font-black px-3 py-1.5 rounded-lg border-2 border-amber-400 text-amber-500 whitespace-nowrap">
                {item.percent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Betting Bonus */}
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-amber-500 tracking-wide mb-4">
          1 LEVEL BETTING BONUS
        </h3>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Trophy size={20} className="text-amber-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              1st Level (Direct)
            </p>
            <p className="text-xs text-gray-500 leading-snug">
              Get up to 30% of your friend's net betting commission
            </p>
          </div>

          <span className="text-sm font-black px-3 py-1.5 rounded-lg border-2 border-amber-400 text-amber-500 whitespace-nowrap">
            30%
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <p className="text-sm font-bold text-gray-900 mb-3">Note:</p>

        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-gray-600"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HowToEarn;
