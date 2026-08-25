import {
  AlertCircle,
  CheckCircle,
  Clock,
  Coins,
  Gamepad2,
  Gift,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  claimDailyBonus,
  clearDailyClaimError,
  getDailyClaimStatus,
  resetClaimSuccess,
} from "../redux/Slices/dailyClaimSlice";

const defaultRewards = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 35,
  7: 50,
};

// =======================
// IST Helpers
// =======================
const getISTDateString = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);

const getNextISTMidnight = () => {
  const nowIST = getISTDateString();
  const [y, m, d] = nowIST.split("-").map(Number);
  return new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}T00:00:00+05:30`,
  );
};

// Golden text style
const goldenTextStyle = {
  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #F59E0B 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// Which icon each day shows (matches reference: coin/coins on even days + day1, gift on odd days after day1)
const getDayIcon = (day) =>
  day === 3 || day === 5 || day === 7 ? Gift : Coins;

// =======================
// RewardCard Component - Mobile First with Navigation
// =======================
const RewardCard = ({ title, subtitle, button, image, navigateTo }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-lg group active:scale-[0.98] transition-transform duration-150 cursor-pointer"
      onClick={handleClick}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div> */}
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 min-h-[190px] flex flex-col justify-between"></div>
    </div>
  );
};

// =======================
// Main Activity Component - Mobile First
// =======================
const Activity = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [istCurrentDate, setIstCurrentDate] = useState(getISTDateString);

  const {
    loading,
    claimLoading,
    currentDay,
    claimedDay,
    claimSuccess,
    canClaim,
    rewards,
    error,
    reward,
  } = useSelector((state) => state.dailyClaim);

  // Countdown ticker
  const updateTimeRemaining = useCallback(() => {
    const now = new Date();
    const midnight = getNextISTMidnight();
    const diff = midnight.getTime() - now.getTime();

    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeUntilReset("New day available!");
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      await dispatch(getDailyClaimStatus()).unwrap();
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
  }, [dispatch]);

  // Lifecycle effects
  useEffect(() => {
    fetchStatus();
    updateTimeRemaining();
  }, [fetchStatus, updateTimeRemaining]);

  useEffect(() => {
    const id = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(id);
  }, [updateTimeRemaining]);

  useEffect(() => {
    const id = setInterval(() => {
      setIstCurrentDate((prev) => {
        const today = getISTDateString();
        if (today !== prev) {
          fetchStatus();
          return today;
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const id = setTimeout(() => {
        setShowError(false);
        dispatch(clearDailyClaimError());
      }, 5000);
      return () => clearTimeout(id);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (claimSuccess) {
      const id = setTimeout(() => dispatch(resetClaimSuccess()), 3000);
      return () => clearTimeout(id);
    }
  }, [claimSuccess, dispatch]);

  const handleClaim = async () => {
    if (!canClaim) return;
    try {
      await dispatch(claimDailyBonus()).unwrap();
    } catch (err) {
      console.error("Claim failed:", err);
    }
  };

  const handleRefresh = () => {
    fetchStatus();
    setIstCurrentDate(getISTDateString());
    updateTimeRemaining();
  };

  const rewardData =
    rewards && Object.keys(rewards).length > 0 ? rewards : defaultRewards;
  const rewardList = Object.entries(rewardData)
    .map(([day, amount]) => ({ day: Number(day), amount }))
    .sort((a, b) => a.day - b.day);

  // Loading state
  if (loading && !canClaim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-white py-4 px-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg px-4 py-3 mb-4 border border-amber-200/40">
          <h1 className="text-xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-500" />
            Activity
          </h1>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl shadow-2xl p-8 max-w-sm mx-auto border-2 border-amber-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-shimmer"></div>
          <div className="relative z-10 text-center">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-amber-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium text-sm">
              Loading daily rewards...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4 px-4 pb-20">
      {/* Header - Mobile Optimized */}
      <div className="text-center mb-4 px-6">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-amber-400 text-xs">✦</span>
          <Sparkles size={14} className="text-amber-500" />
          <h2 className="text-lg font-extrabold">7 Days Daily Claim</h2>
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-amber-400 text-xs">✦</span>
        </div>
        <p className="text-gray-500 text-[11px] mt-1">
          Claim daily and win exciting rewards
        </p>
      </div>

      {/* ============================================= */}
      {/* Daily Claim Card - Pixel-matched, White/Gold Theme */}
      {/* ============================================= */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden mb-4 px-3 pt-4 pb-4">
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={loading || claimLoading}
          className="absolute top-3 right-3 p-1.5 hover:bg-amber-50 rounded-full transition-all duration-300 hover:rotate-180 border border-amber-200 z-20"
        >
          <RefreshCw
            size={14}
            className={`${loading ? "animate-spin" : ""} text-amber-500`}
          />
        </button>

        {/* Title row: ✦ Sparkle  7 Days Daily Claim  Sparkle ✦ */}

        {/* Days Row - 7 cards, current day taller & filled gold, like reference */}
        <div className="flex items-end gap-1.5">
          {rewardList.map((item) => {
            const isCompleted = item.day < currentDay;
            const isCurrent = item.day === currentDay && canClaim;
            const isLocked =
              item.day > currentDay || (item.day === currentDay && !canClaim);
            const Icon = getDayIcon(item.day);

            return (
              <div
                key={item.day}
                className={`flex-1 flex flex-col items-center rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? "bg-gradient-to-b from-amber-400 to-yellow-500 border-amber-500 shadow-lg py-4"
                    : isCompleted
                      ? "bg-white border-amber-400 py-2.5"
                      : "bg-white border-dashed border-amber-300 py-2.5"
                }`}
              >
                {/* Day label */}
                <span
                  className={`text-[9px] font-bold mb-1 ${
                    isCurrent
                      ? "text-gray-900"
                      : isCompleted
                        ? "text-amber-700"
                        : "text-gray-400"
                  }`}
                >
                  Day {item.day}
                </span>

                {/* Icon */}
                <div className="mb-1">
                  {isCompleted ? (
                    <CheckCircle size={16} className="text-amber-600" />
                  ) : (
                    <Icon
                      size={16}
                      className={
                        isCurrent
                          ? "text-gray-900"
                          : isLocked
                            ? "text-amber-300"
                            : "text-amber-500"
                      }
                    />
                  )}
                </div>

                {/* Amount */}
                <span
                  className={`text-[10px] font-black mb-1.5 ${
                    isCurrent
                      ? "text-gray-900"
                      : isLocked
                        ? "text-gray-400"
                        : "text-gray-700"
                  }`}
                >
                  ₹{item.amount}
                </span>

                {/* Action */}
                {isCurrent ? (
                  <button
                    onClick={handleClaim}
                    disabled={claimLoading}
                    className="w-[85%] bg-amber-700 hover:bg-amber-800 text-white text-[8px] font-bold py-1 rounded-full transition-colors disabled:opacity-70"
                  >
                    {claimLoading ? "..." : "Claim"}
                  </button>
                ) : isCompleted ? (
                  <span className="w-[85%] text-center bg-amber-100 text-amber-700 text-[8px] font-bold py-1 rounded-full">
                    Claimed
                  </span>
                ) : (
                  <span className="w-[85%] text-center border border-amber-300 text-gray-400 text-[8px] font-bold py-1 rounded-full">
                    Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset timer */}
        {!canClaim && !loading && (
          <p className="mt-3 text-center text-[10px] text-amber-600 flex items-center justify-center gap-1">
            <Clock size={11} /> Resets in {timeUntilReset}
          </p>
        )}

        {/* Success Banner */}
        {claimSuccess && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl animate-slideDown">
            <div className="flex items-center justify-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full animate-bounce">
                <Zap size={14} className="text-white" />
              </div>
              <p className="font-bold text-amber-700 text-xs">
                ₹{reward} claimed for Day {claimedDay}!
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {showError && error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl animate-shake">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium text-xs">{error}</p>
              </div>
              <button
                onClick={() => {
                  setShowError(false);
                  dispatch(clearDailyClaimError());
                }}
                className="text-red-700 font-bold hover:bg-red-100 p-0.5 px-2 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reward Cards - Mobile Optimized with Navigation */}
      <div className="space-y-3">
        <RewardCard
          title="FIRST RECHARGE"
          subtitle="Extra bonus on first recharge!"
          button="Recharge"
          image="https://i.ibb.co/V0THwFvm/banner1.png"
          navigateTo="/deposit"
        />

        <RewardCard
          title="REFER & EARN"
          subtitle="Invite friends & earn unlimited"
          button="Refer Now"
          image="https://i.ibb.co/vxQwyNXC/banner2.png"
          navigateTo="/promo"
        />

        <RewardCard
          title="PLAY & WIN"
          subtitle="Win exciting prizes everyday"
          button="Play Now"
          image="https://i.ibb.co/PzhpvsHt/banner3.png"
          navigateTo="/matka"
        />
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-3px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(3px);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Activity;
