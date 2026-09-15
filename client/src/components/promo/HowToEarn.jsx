import { Shield, Trophy } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getReferralLevels } from "../../redux/slices/referralLevelSlice";

const notes = [
  "Bonus will be added automatically to your wallet.",
  "Only first recharge of your referred friend is valid.",
  "Betting bonus is calculated on net commission.",
  "Promo rules are subject to change without notice.",
];

const shieldColors = [
  "text-amber-400",
  "text-blue-400",
  "text-purple-400",
  "text-green-400",
  "text-pink-400",
  "text-cyan-400",
  "text-orange-400",
  "text-indigo-400",
];

const HowToEarn = () => {
  const dispatch = useDispatch();

  const { levels, loading, error } = useSelector(
    (state) => state.referralLevel,
  );

  useEffect(() => {
    dispatch(getReferralLevels());
  }, [dispatch]);

  const activeLevels = levels
    ?.filter((item) => item.status)
    ?.sort((a, b) => a.level - b.level)
    ?.slice(0, 4);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-amber-500 tracking-wide">
        HOW TO EARN?
      </h2>

      {/* Dynamic Recharge Bonus */}
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-amber-500 tracking-wide mb-4">
          {activeLevels?.length || 0} LEVEL FIRST RECHARGE BONUS
        </h3>

        {loading ? (
          <div className="py-5 text-center text-sm text-gray-500">
            Loading levels...
          </div>
        ) : error ? (
          <div className="py-5 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeLevels?.map((item, index) => {
              const shieldColor = shieldColors[index % shieldColors.length];

              return (
                <div
                  key={item._id || item.level}
                  className="flex items-center gap-3 py-3.5"
                >
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <Shield
                      size={44}
                      className={shieldColor}
                      fill="currentColor"
                    />

                    <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-black">
                      {item.level}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {item.level === 1
                        ? "1st Level (Direct)"
                        : `${item.level}${
                            item.level === 2
                              ? "nd"
                              : item.level === 3
                                ? "rd"
                                : "th"
                          } Level`}
                    </p>

                    <p className="text-xs text-gray-500 leading-snug">
                      Get {item.percentage}% of your friend's first recharge
                    </p>
                  </div>

                  <span className="text-sm font-black px-3 py-1.5 rounded-lg border-2 border-amber-400 text-amber-500 whitespace-nowrap">
                    {item.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
