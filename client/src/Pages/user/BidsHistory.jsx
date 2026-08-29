import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  History,
  RefreshCw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { clearBidError, getBiddingHistory } from "../../redux/slices/bidSlice";
import { getCurrencyRates } from "../../redux/slices/currencyRateSlice";

// =========================================================
// COUNTRY NORMALIZATION - Same as PlaceBid
// user.country can come in different shapes from the backend
// ("uae", "UAE", "ae", "AE", "United Arab Emirates", etc.)
// while the currencyRate collection always stores a clean
// 2-letter countryCode ("AE", "IN", "AU", "PK", "BD", "NP").
// This maps any of those variants to the canonical code.
// =========================================================
const COUNTRY_ALIASES = {
  in: "IN",
  india: "IN",
  au: "AU",
  australia: "AU",
  pk: "PK",
  pakistan: "PK",
  bd: "BD",
  bangladesh: "BD",
  np: "NP",
  nepal: "NP",
  ae: "AE",
  uae: "AE",
  dubai: "AE",
  "united arab emirates": "AE",
};

const normalizeCountryCode = (country) => {
  if (!country) return "";
  const key = String(country).trim().toLowerCase();
  return COUNTRY_ALIASES[key] || key.toUpperCase();
};

const getCurrencySymbol = (country) => {
  const symbols = {
    IN: "₹",
    AU: "$",
    PK: "₨",
    BD: "৳",
    NP: "रू",
    AE: "د.إ",
    default: "₹",
  };

  return symbols[normalizeCountryCode(country)] || symbols.default;
};

// =========================================================
// END OF COUNTRY NORMALIZATION
// =========================================================

const BidsHistory = () => {
  const dispatch = useDispatch();

  const bidState = useSelector((state) => state.bid) || {};
  const {
    bids = [],
    loading = false,
    pagination = { total: 0, pages: 0, page: 1, limit: 10 },
    error = null,
    message = null,
  } = bidState;

  const { user } = useSelector((state) => state.auth);

  // Currency rates (used to display amounts in the user's own currency)
  const currencies = useSelector((state) => state.currencyRate?.currencies);

  const [filter, setFilter] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    dispatch(getBiddingHistory(filter));
  }, [dispatch, filter]);

  // Fetch currency rates once on mount
  useEffect(() => {
    dispatch(getCurrencyRates());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setActionMessage({ type: "error", text: error });
      setTimeout(() => {
        setActionMessage(null);
        dispatch(clearBidError());
      }, 5000);
    }
    if (message) {
      setActionMessage({ type: "success", text: message });
      setTimeout(() => setActionMessage(null), 3000);
    }
  }, [error, message, dispatch]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: "from-amber-400 to-yellow-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: Clock,
        label: "Pending",
        glow: "shadow-amber-500/30",
      },
      won: {
        color: "from-emerald-400 to-green-500",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: Trophy,
        label: "Won",
        glow: "shadow-emerald-500/30",
      },
      lost: {
        color: "from-red-400 to-rose-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: XCircle,
        label: "Lost",
        glow: "shadow-red-500/30",
      },
      cancelled: {
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: AlertCircle,
        label: "Cancelled",
        glow: "shadow-gray-500/30",
      },
    };
    return configs[status] || configs.pending;
  };

  const normalizeGameType = (gameType) =>
    String(gameType || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

  const getGameTypeDisplay = (type) => {
    type = normalizeGameType(type);
    const display = {
      single: "Single",
      jodi: "Jodi",
      "single-patti": "Single Patti",
      "double-patti": "Double Patti",
      "triple-patti": "Triple Patti",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };
    return display[type] || type;
  };

  const getDigitType = (bid) => {
    if (bid?.digitType === "2-digit") {
      return "2-digit";
    }

    if (bid?.digitType === "3-digit") {
      return "3-digit";
    }

    // Some APIs return digitType through populated marketId.
    if (bid?.marketId?.digitType === "2-digit") {
      return "2-digit";
    }

    if (bid?.marketId?.digitType === "3-digit") {
      return "3-digit";
    }

    // Fallback based on game type.
    if (["panna", "half-sangam"].includes(bid?.gameType)) {
      return "3-digit";
    }

    return "";
  };

  const getGameTypeLabel = (type) => {
    type = normalizeGameType(type);
    const display = {
      single: "Single",
      jodi: "Jodi",
      "single-patti": "Single Patti",
      "double-patti": "Double Patti",
      "triple-patti": "Triple Patti",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };

    return display[type] || type || "Game";
  };

  // =========================================================
  // CURRENCY CONVERSION - Improved to match PlaceBid
  // rate = "1 unit of that currency = X INR" (INR/IN has rate 1)
  // So: convertedAmount = amountInINR / rate
  // Bid amounts are stored/compared in INR on the backend.
  // Only the DISPLAY is converted to the user's local currency.
  //
  // user.country can arrive as "uae", "UAE", "ae", etc. while the
  // currencyRate collection stores a clean 2-letter countryCode
  // ("AE"). We normalize both sides before comparing.
  // =========================================================
  const userCountryCode = useMemo(
    () => normalizeCountryCode(user?.country),
    [user?.country],
  );

  const currencySymbol = getCurrencySymbol(user?.country);

  const userCurrencyRate = useMemo(() => {
    if (!currencies || currencies.length === 0 || !userCountryCode) return null;
    return (
      currencies.find(
        (c) =>
          String(c.countryCode).trim().toUpperCase() === userCountryCode &&
          c.status,
      ) || null
    );
  }, [currencies, userCountryCode]);

  const formatCurrency = (amount) => {
    const amt = Number(amount) || 0;

    // If we know the user's currency and it isn't INR, show converted value
    if (userCurrencyRate && userCurrencyRate.countryCode !== "IN") {
      const converted = amt / userCurrencyRate.rate;
      return `${converted.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${userCurrencyRate.currencyCode}`;
    }

    // Fallback: INR (default/original behavior)
    return `${currencySymbol}${amt.toLocaleString("en-IN")}`;
  };

  // ============================================================
  // NUMBER / RESULT DISPLAY
  // ============================================================
  //
  // Half Sangam:
  //   123-5  = Panna + Digit
  //   5-123  = Digit + Panna
  //
  // Full Sangam:
  //   123-456 = Panna + Panna
  //
  // Do NOT split Sangam values into a normal 2/3 digit ball count.
  // Keep the "-" separator visible.
  // ============================================================

  const getDigitCount = (gameType) => {
    gameType = normalizeGameType(gameType);
    switch (gameType) {
      case "single":
        return 1;
      case "jodi":
        return 2;
      case "single-patti":
      case "double-patti":
      case "triple-patti":
      case "panna":
        return 3;
      case "half-sangam":
        return 4;
      case "full-sangam":
        return 6;
      case "last-digit":
      case "first-digit":
        return 1;
      default:
        return 2;
    }
  };

  const normalizeNumber = (number) => {
    if (number === undefined || number === null) return "";
    return String(number).trim();
  };

  const isHalfSangam = (gameType) =>
    normalizeGameType(gameType) === "half-sangam";

  const isFullSangam = (gameType) =>
    normalizeGameType(gameType) === "full-sangam";

  const getSangamParts = (number, gameType) => {
    const str = normalizeNumber(number);

    if (!str) {
      return {
        first: "",
        second: "",
      };
    }

    if (isHalfSangam(gameType) || isFullSangam(gameType)) {
      const parts = str.split("-");

      if (parts.length === 2) {
        return {
          first: parts[0],
          second: parts[1],
        };
      }
    }

    return {
      first: str,
      second: "",
    };
  };

  const getResultDigits = (number, gameType) => {
    gameType = normalizeGameType(gameType);
    const str = normalizeNumber(number);

    if (!str) return [];

    // Sangam must remain as two separate groups.
    if (isHalfSangam(gameType) || isFullSangam(gameType)) {
      const { first, second } = getSangamParts(str, gameType);

      return {
        sangam: true,
        first: first.split(""),
        second: second.split(""),
      };
    }

    const digitCount = getDigitCount(gameType);
    const digits = str.split("");

    while (digits.length < digitCount) {
      digits.unshift("0");
    }

    return {
      sangam: false,
      first: digits.slice(-digitCount),
      second: [],
    };
  };

  // ============================================================
  // RENDER NUMBER
  // ============================================================

  const renderNumberBalls = (number, status, gameType, size = "md") => {
    if (!number) return null;

    const parsed = getResultDigits(number, gameType);

    const isWin = status === "won";
    const isLost = status === "lost";

    const sizeClasses =
      size === "sm"
        ? "w-6 h-6 text-[9px]"
        : size === "lg"
          ? "w-10 h-10 text-sm"
          : "w-8 h-8 text-xs";

    const ballClass = `
      ${sizeClasses}
      rounded-full
      flex items-center justify-center
      text-white font-extrabold
      ${
        isWin
          ? "bg-gradient-to-br from-green-400 to-emerald-600 shadow-md shadow-emerald-300/50"
          : isLost
            ? "bg-gradient-to-br from-red-400 to-rose-600 shadow-md shadow-red-300/50"
            : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-300/50"
      }
    `;

    // ----------------------------------------------------------
    // HALF / FULL SANGAM
    // ----------------------------------------------------------

    if (parsed.sangam) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            {parsed.first.map((digit, index) => (
              <div key={`first-${index}`} className={ballClass}>
                {digit}
              </div>
            ))}
          </div>

          <span className="font-extrabold text-gray-400 text-xs">-</span>

          <div className="flex items-center gap-1">
            {parsed.second.map((digit, index) => (
              <div key={`second-${index}`} className={ballClass}>
                {digit}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ----------------------------------------------------------
    // NORMAL GAME
    // ----------------------------------------------------------

    return (
      <div className="flex items-center gap-1">
        {parsed.first.map((digit, index) => (
          <div key={index} className={ballClass}>
            {digit}
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDER RESULT
  // ============================================================

  const renderResultNumber = (number, gameType) => {
    if (number === undefined || number === null || number === "") {
      return <span className="text-[10px] text-gray-400">Pending</span>;
    }

    const parsed = getResultDigits(number, gameType);

    if (parsed.sangam) {
      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            {parsed.first.map((digit, index) => (
              <div
                key={`result-first-${index}`}
                className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-[10px] font-extrabold text-gray-700"
              >
                {digit}
              </div>
            ))}
          </div>

          <span className="font-extrabold text-gray-400 text-[10px]">-</span>

          <div className="flex items-center gap-1">
            {parsed.second.map((digit, index) => (
              <div
                key={`result-second-${index}`}
                className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-[10px] font-extrabold text-gray-700"
              >
                {digit}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {parsed.first.map((digit, index) => (
          <div
            key={index}
            className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-[10px] font-extrabold text-gray-700"
          >
            {digit}
          </div>
        ))}
      </div>
    );
  };

  const bidsArray = Array.isArray(bids) ? bids : [];

  // Calculate statistics
  const totalBids = bidsArray.length;
  const totalWon = bidsArray.filter((b) => b.status === "won").length;
  const totalPending = bidsArray.filter((b) => b.status === "pending").length;
  const totalAmount = bidsArray.reduce((sum, b) => sum + (b.bidAmount || 0), 0);
  const totalWinAmount = bidsArray.reduce(
    (sum, b) => sum + (b.winAmount || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 px-4 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <History size={24} className="text-amber-500" />
              Bidding History
            </h1>
            <p className="text-sm text-gray-400">
              {pagination?.total || 0} total bids placed
            </p>
          </div>
          <button
            onClick={() => dispatch(getBiddingHistory(filter))}
            className="p-2 bg-white rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Stats Cards */}
        {bidsArray.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              {
                icon: Coins,
                gradient: "from-blue-500 to-indigo-600",
                label: "Total Bids",
                value: totalBids,
              },
              {
                icon: DollarSign,
                gradient: "from-green-500 to-emerald-600",
                label: "Invested",
                value: formatCurrency(totalAmount),
              },
              {
                icon: Trophy,
                gradient: "from-amber-500 to-orange-600",
                label: "Won",
                value: formatCurrency(totalWinAmount),
              },
              {
                icon: BarChart3,
                gradient: "from-purple-500 to-violet-600",
                label: "Win Rate",
                value:
                  totalBids > 0
                    ? `${Math.round((totalWon / totalBids) * 100)}%`
                    : "0%",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <stat.icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-sm font-extrabold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Filter:
            </span>
            <select
              value={filter.status}
              onChange={(e) =>
                setFilter({ ...filter, status: e.target.value, page: 1 })
              }
              className="px-4 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="mb-4">
            <div
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 ${
                actionMessage.type === "success"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-700"
                  : "bg-red-50/80 border-red-200 text-red-700"
              }`}
            >
              <span className="text-lg">
                {actionMessage.type === "success" ? "✅" : "⚠️"}
              </span>
              <span className="text-sm">{actionMessage.text}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !actionMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Bids list */}
        {bidsArray.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Cards list — no horizontal scroll on any screen size */}
            <div className="divide-y divide-gray-100">
              {bidsArray.map((bid) => {
                const statusConfig = getStatusConfig(bid.status);
                const StatusIcon = statusConfig.icon;
                const gameTypeDisplay = getGameTypeDisplay(bid.gameType);
                const isResultDeclared =
                  bid.resultNumber !== null &&
                  bid.resultNumber !== undefined &&
                  bid.resultNumber !== "";

                return (
                  <div
                    key={bid._id}
                    className="p-3.5 hover:bg-amber-50/30 transition-colors"
                  >
                    {/* Row 1: Market + Status */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {bid.marketId?.name || "N/A"}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {bid.marketId?.marketId || ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r ${statusConfig.color} text-white shadow-sm flex-shrink-0`}
                      >
                        <StatusIcon size={10} />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Row 2: Game type + Date */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700">
                          {gameTypeDisplay}
                        </span>

                        {bid.gameType === "half-sangam" && (
                          <span className="text-[9px] text-gray-400">
                            123-5 / 5-123
                          </span>
                        )}

                        {bid.gameType === "full-sangam" && (
                          <span className="text-[9px] text-gray-400">
                            123-456
                          </span>
                        )}

                        {getDigitType(bid) && (
                          <span className="px-2 py-1 text-[9px] font-extrabold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            {getDigitType(bid)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">
                          {new Date(bid.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {new Date(bid.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Number, Result, Amount */}
                    <div className="flex items-center justify-between gap-2 bg-gray-50/70 rounded-xl px-3 py-2.5">
                      {/* Your Number */}
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Your Number
                        </p>
                        {renderNumberBalls(
                          bid.number,
                          bid.status,
                          bid.gameType,
                          "sm",
                        )}
                      </div>

                      {/* Result */}
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Result
                        </p>
                        {isResultDeclared ? (
                          renderResultNumber(bid.resultNumber, bid.gameType)
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Amount
                        </p>
                        <p className="text-sm font-bold text-gray-700">
                          {formatCurrency(bid.bidAmount)}
                        </p>
                        {bid.winAmount > 0 && (
                          <p className="text-[10px] font-extrabold text-green-500">
                            +{formatCurrency(bid.winAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {bidsArray.length} of {pagination?.total || 0} bids
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilter({
                      ...filter,
                      page: Math.max(1, filter.page - 1),
                    })
                  }
                  disabled={filter.page === 1}
                  className="px-4 py-1.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-4 py-1.5 rounded-xl text-sm font-bold bg-amber-100 text-amber-700">
                  {filter.page} / {pagination?.pages || 1}
                </span>
                <button
                  onClick={() =>
                    setFilter({
                      ...filter,
                      page: Math.min(pagination?.pages || 1, filter.page + 1),
                    })
                  }
                  disabled={filter.page === (pagination?.pages || 1)}
                  className="px-4 py-1.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4 opacity-30">📭</div>
            <p className="text-gray-500 text-lg font-medium">No Bids Found</p>
            <p className="text-gray-400 text-sm mt-1">
              Start exploring active markets and place your first bid!
            </p>
            <Link
              to="/matka/markets"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all"
            >
              <Target size={16} />
              Browse Markets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidsHistory;
