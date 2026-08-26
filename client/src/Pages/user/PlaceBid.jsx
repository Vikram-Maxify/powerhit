import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  Clock,
  Coins,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { clearBidError, placeBid } from "../../redux/slices/bidSlice";
import {
  clearCurrentMarket,
  getMarketById,
} from "../../redux/slices/marketSlice";
import {
  fetchPublicBidResults,
  selectPublicBidResults,
} from "../../redux/slices/publicBidSlice";

const getCurrencySymbol = (country) => {
  const symbols = { IN: "₹", US: "$", GB: "£", EU: "€", default: "₹" };
  return symbols[country] || symbols.default;
};

// Generates round, human-friendly bid amounts between minBid and maxBid.
// Picks "nice" numbers (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 x 10^n) within range,
// always includes min & max, and caps the button count so the UI stays clean.
const generateBidAmounts = (min, max, maxButtons = 9) => {
  if (!min || !max || min >= max) return [min || 0];

  const niceBases = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
  const candidates = new Set();
  let magnitude = 1;

  while (magnitude <= max) {
    niceBases.forEach((b) => {
      const val = Math.round(b * magnitude);
      if (val >= min && val <= max) candidates.add(val);
    });
    magnitude *= 10;
  }

  candidates.add(min);
  candidates.add(max);

  let amounts = Array.from(candidates).sort((a, b) => a - b);

  if (amounts.length > maxButtons) {
    const step = (amounts.length - 1) / (maxButtons - 1);
    const picked = [];
    for (let i = 0; i < maxButtons; i++) {
      picked.push(amounts[Math.round(i * step)]);
    }
    amounts = Array.from(new Set(picked));
  }

  return amounts;
};

// Returns a YYYY-MM-DD key for a date string, normalized to IST so
// "today" / "yesterday" grouping matches the market's declared-result day.
const toISTDateKey = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const formatShortDate = (dateKey) => {
  if (!dateKey) return "";
  const d = new Date(`${dateKey}T00:00:00`);
  return d
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    .toUpperCase();
};

const PlaceBid = () => {
  const { marketId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentMarket, loading: marketLoading } = useSelector(
    (state) => state.market,
  );

  const { user } = useSelector((state) => state.auth);

  const {
    loading: bidLoading,
    error,
    message,
  } = useSelector((state) => state.bid);

  const { results: publicResults, loading: resultsLoading } = useSelector(
    selectPublicBidResults,
  );

  // MUST BE BEFORE marketDigitType
  const { gameType: autoGameType, digitType: autoDigitType } =
    location.state || {};

  // Market controls available games
  const marketDigitType =
    currentMarket?.digitType ||
    currentMarket?.marketType ||
    autoDigitType ||
    "";

  const allowedGameTypesByDigitType = useMemo(() => {
    if (marketDigitType === "2-digit") {
      return ["jodi", "last-digit", "first-digit"];
    }

    if (marketDigitType === "3-digit") {
      return [
        "jodi",
        "panna",
        "half-sangam",
        "full-sangam",
        "last-digit",
        "first-digit",
      ];
    }

    return [];
  }, [marketDigitType]);

  const isGameTypeAllowed = (gameType) =>
    allowedGameTypesByDigitType.includes(gameType);

  const currencySymbol = getCurrencySymbol(user?.country);

  const formatCurrency = (amount) => {
    return `${currencySymbol}${Number(amount).toLocaleString("en-IN")}`;
  };

  const [selectedDigits, setSelectedDigits] = useState([]);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);

  const [formData, setFormData] = useState({
    number: "",
    bidAmount: "",
    gameType: autoGameType || "",
  });

  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const [isHalfSangamMode, setIsHalfSangamMode] = useState("triple");
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountError, setCustomAmountError] = useState(""); // Bid amount options derived from the market's minBid/maxBid range
  const bidAmountOptions = useMemo(
    () => generateBidAmounts(currentMarket?.minBid, currentMarket?.maxBid),
    [currentMarket?.minBid, currentMarket?.maxBid],
  );

  // Fetch declared results (panna = 3-digit result, matches the
  // digit-box UI below). status: "all" pulls full declared history.
  // NOT scoped to a single market — we want the latest declared
  // result across ALL markets here.
  useEffect(() => {
    dispatch(
      fetchPublicBidResults({
        gameType: "panna",
        status: "all",
      }),
    );
  }, [dispatch]);

  // Derive "today's result" (most recent declared result today, from
  // ANY market) and "last result" (most recent declared result on the
  // previous day that has a result, from ANY market) from the fetched
  // public results.
  const { todayResult, lastResult, lastResultDateKey } = useMemo(() => {
    if (!publicResults || publicResults.length === 0) {
      return { todayResult: [], lastResult: [], lastResultDateKey: null };
    }

    // No marketId filter here on purpose — pick the latest result
    // overall, regardless of which market it belongs to.
    const marketResults = publicResults.filter((r) => r.resultNumber);

    const sorted = [...marketResults].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    // Keep only the most recent entry per calendar day (IST)
    const byDate = new Map();
    sorted.forEach((r) => {
      const key = toISTDateKey(r.createdAt);
      if (!byDate.has(key)) byDate.set(key, r);
    });

    const sortedDateKeys = Array.from(byDate.keys()).sort((a, b) =>
      b.localeCompare(a),
    );

    const todayKey = toISTDateKey(new Date());
    const todayEntry = byDate.get(todayKey);

    // First declared date that isn't today = previous result day
    const prevDateKey = sortedDateKeys.find((key) => key !== todayKey);
    const prevEntry = prevDateKey ? byDate.get(prevDateKey) : null;

    return {
      todayResult: todayEntry ? todayEntry.resultNumber.split("") : [],
      lastResult: prevEntry ? prevEntry.resultNumber.split("") : [],
      lastResultDateKey: prevDateKey || null,
    };
  }, [publicResults]);

  // =========================================================
  // GAME NUMBER STRUCTURE
  // =========================================================
  // Half Sangam:
  //   Panna + Digit  => 123-5
  //   Digit + Panna  => 5-123
  //
  // Full Sangam:
  //   Panna + Panna  => 123-456
  // =========================================================

  const getDigitsCount = (gameType) => {
    if (gameType === "half-sangam") {
      return 4; // 3+1 or 1+3
    }

    if (gameType === "full-sangam") {
      return 6; // 3+3
    }

    const counts = {
      jodi: 2,
      panna: 3,
      "last-digit": 2,
      "first-digit": 2,
    };

    return counts[gameType] || 1;
  };

  const getDigitLabels = (gameType) => {
    if (gameType === "half-sangam") {
      return isHalfSangamMode === "single"
        ? ["Digit", "H", "T", "U"]
        : ["H", "T", "U", "Digit"];
    }

    if (gameType === "full-sangam") {
      return ["OH", "OT", "OU", "CH", "CT", "CU"];
    }

    const labels = {
      jodi: ["1st", "2nd"],
      panna: ["H", "T", "U"],
      "last-digit": ["T", "U"],
      "first-digit": ["T", "U"],
    };

    return labels[gameType] || ["Digit"];
  };

  const buildGameNumber = (gameType, digits) => {
    const values = digits.map((d) => d ?? "");

    if (gameType === "half-sangam") {
      if (isHalfSangamMode === "single") {
        // Digit + Panna
        return `${values[0]}-${values.slice(1, 4).join("")}`;
      }

      // Panna + Digit
      return `${values.slice(0, 3).join("")}-${values[3]}`;
    }

    if (gameType === "full-sangam") {
      return `${values.slice(0, 3).join("")}-${values.slice(3, 6).join("")}`;
    }

    return values.join("");
  };

  const getNumberHint = (gameType) => {
    const hints = {
      jodi: "00-99",
      panna: "000-999",
      "half-sangam": "123-5 or 5-123",
      "full-sangam": "123-456",
      "last-digit": "00-99",
      "first-digit": "00-99",
    };

    return hints[gameType] || "";
  };

  const digitCount = getDigitsCount(formData.gameType);
  const digitLabels = getDigitLabels(formData.gameType);
  const digits = Array.from({ length: 10 }, (_, i) => i.toString());

  useEffect(() => {
    dispatch(getMarketById(marketId));
    return () => {
      dispatch(clearCurrentMarket());
      dispatch(clearBidError());
    };
  }, [dispatch, marketId]);

  useEffect(() => {
    if (!autoGameType) return;

    if (
      allowedGameTypesByDigitType.length > 0 &&
      !allowedGameTypesByDigitType.includes(autoGameType)
    ) {
      setFormData((prev) => ({ ...prev, gameType: "" }));
      setSelectedDigits([]);
      setCurrentDigitIndex(0);
      setLocalError(`This game is not available for ${marketDigitType} market`);
      return;
    }

    setFormData((prev) => ({ ...prev, gameType: autoGameType }));
    setSelectedDigits([]);
    setCurrentDigitIndex(0);
    if (autoGameType === "half-sangam") {
      setIsHalfSangamMode("triple");
    }
  }, [autoGameType, marketDigitType, allowedGameTypesByDigitType]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
      setTimeout(() => {
        setLocalError("");
        dispatch(clearBidError());
      }, 5000);
    }
  }, [error, dispatch]);

  const handleDigitSelect = (digit) => {
    // Half Sangam always needs 4 values.
    // single mode = Digit + Panna (5-123)
    // triple mode = Panna + Digit (123-5)
    const newSelected = [...selectedDigits];
    newSelected[currentDigitIndex] = digit;
    setSelectedDigits(newSelected);
    const count = getDigitsCount(formData.gameType);
    if (currentDigitIndex < count - 1)
      setCurrentDigitIndex(currentDigitIndex + 1);

    setFormData({
      ...formData,
      number: buildGameNumber(formData.gameType, newSelected),
    });
  };

  const handleRemoveDigit = () => {
    if (currentDigitIndex > 0) {
      const newSelected = [...selectedDigits];
      newSelected[currentDigitIndex - 1] = null;
      setSelectedDigits(newSelected);
      setCurrentDigitIndex(currentDigitIndex - 1);
      setFormData({
        ...formData,
        number: buildGameNumber(formData.gameType, newSelected),
      });
    } else if (selectedDigits[0] !== null && selectedDigits[0] !== undefined) {
      setSelectedDigits([]);
      setCurrentDigitIndex(0);
      setFormData({ ...formData, number: "" });
    }
  };

  const resetSelection = () => {
    setSelectedDigits([]);
    setCurrentDigitIndex(0);
    setFormData({ ...formData, number: "" });
  };

  const isAllDigitsSelected = () => {
    if (!formData.gameType) return false;
    const count = getDigitsCount(formData.gameType);
    return (
      selectedDigits.length === count &&
      selectedDigits.every((d) => d !== null && d !== undefined)
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError("");
    setSuccess("");
  };

  const handleBidAmountClick = (amount) => {
    setIsCustomAmount(false);
    setCustomAmountError("");
    setFormData({ ...formData, bidAmount: amount.toString() });
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    // allow only digits
    if (value !== "" && !/^\d+$/.test(value)) return;

    setFormData({ ...formData, bidAmount: value });

    if (value === "") {
      setCustomAmountError("");
      return;
    }

    const amount = parseInt(value, 10);
    const min = currentMarket?.minBid;
    const max = currentMarket?.maxBid;

    if (min && amount < min) {
      setCustomAmountError(`Minimum bid is ${formatCurrency(min)}`);
    } else if (max && amount > max) {
      setCustomAmountError(`Maximum bid is ${formatCurrency(max)}`);
    } else {
      setCustomAmountError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccess("");

    if (!marketDigitType) {
      return setLocalError(
        "Market digit type is not configured. Please select 2-digit or 3-digit market.",
      );
    }

    if (!isGameTypeAllowed(formData.gameType)) {
      return setLocalError(
        `${getGameTypeDisplay(formData.gameType)} is not available for ${marketDigitType} market`,
      );
    }

    if (!isAllDigitsSelected())
      return setLocalError("Please select all digits");
    if (!formData.bidAmount || parseFloat(formData.bidAmount) <= 0)
      return setLocalError("Enter valid bid amount");
    if (isCustomAmount && customAmountError)
      return setLocalError(customAmountError);

    const bidAmount = parseFloat(formData.bidAmount);
    if (bidAmount < currentMarket?.minBid)
      return setLocalError(`Min: ${currencySymbol}${currentMarket?.minBid}`);
    if (bidAmount > currentMarket?.maxBid)
      return setLocalError(`Max: ${currencySymbol}${currentMarket?.maxBid}`);
    if (bidAmount > user?.balance.local)
      return setLocalError(`Insufficient balance`);

    const result = await dispatch(
      placeBid({
        marketId,
        gameType: formData.gameType,
        number: formData.number,
        bidAmount,
      }),
    );

    if (result.payload?.success) {
      setSuccess(result.payload.message);
      resetSelection();
      setIsCustomAmount(false);
      setCustomAmountError("");
      setFormData({ number: "", bidAmount: "", gameType: formData.gameType });
      setTimeout(() => navigate("/matka/bids-history"), 2000);
    }
  };

  const gameTypes = allowedGameTypesByDigitType;

  const getGameTypeDisplay = (type) => {
    const display = {
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };
    return display[type] || type;
  };

  const getGameTypeIcon = (type) => {
    const icons = {
      jodi: "🔢",
      panna: "🎲",
      "half-sangam": "🌓",
      "full-sangam": "🌕",
      "last-digit": "🔚",
      "first-digit": "🔛",
    };
    return icons[type] || "⭐";
  };

  const calculateWinAmount = () => {
    if (!formData.bidAmount || !formData.gameType) return 0;
    const multipliers = {
      jodi: 90,
      panna: 90,
      "half-sangam": 450,
      "full-sangam": 900,
      "last-digit": 9,
      "first-digit": 9,
    };
    return (
      parseFloat(formData.bidAmount) * (multipliers[formData.gameType] || 9)
    );
  };

  const getMultiplierDisplay = (gameType) => {
    const multipliers = {
      jodi: "90x",
      panna: "90x",
      "half-sangam": "450x",
      "full-sangam": "900x",
      "last-digit": "9x",
      "first-digit": "9x",
    };
    return multipliers[gameType] || "9x";
  };

  const getWinDescription = (gameType) => {
    const descriptions = {
      jodi: "Match the exact two-digit number",
      panna: "Match the exact three-digit number",
      "half-sangam": "Match 1-digit or 3-digit combination",
      "full-sangam": "Match the exact two-digit number",
      "last-digit": "Match the last digit of winning number",
      "first-digit": "Match the first digit of winning number",
    };
    return descriptions[gameType] || "";
  };

  const getAboutText = (gameType) => {
    const abouts = {
      jodi: {
        title: "ABOUT JODI",
        desc: "Select any two numbers from 0 to 9. If your selected number matches the last two digits of the result, you win!",
        example:
          "Result: 4 6 8 → Last two digits: 6 8 → Jodi: 6 8 → You Win! 🎉",
      },
      panna: {
        title: "ABOUT PANEL",
        desc: "Select any three numbers from 0 to 9. If any one matches the result digits, you win!",
        example: "Result: 4 6 8 → You selected: 2-5-8 → Match: 8 → You Win! 🎉",
      },
      "half-sangam": {
        title: "ABOUT HALF-SANGAM",
        desc: "Select one digit and one Panna. You can play Digit + Panna (5-123) or Panna + Digit (123-5).",
        example:
          "Example: 123-5 or 5-123 → Both sides must match the declared result.",
      },
      "full-sangam": {
        title: "ABOUT FULL-SANGAM",
        desc: "Select two Pannas: one for Open and one for Close. The format is 123-456.",
        example:
          "Example: 123-456 → Open Panna 123 + Close Panna 456 must both match.",
      },
      "last-digit": {
        title: "ABOUT LAST DIGIT",
        desc: "Select two numbers. If the last digit matches the winning number's last digit, you win!",
        example:
          "Result: 3 4 → You selected: 54 → Last digit match: 4 → You Win! 🎉",
      },
      "first-digit": {
        title: "ABOUT FIRST DIGIT",
        desc: "Select two numbers. If the first digit matches the winning number's first digit, you win!",
        example:
          "Result: 3 4 → You selected: 32 → First digit match: 3 → You Win! 🎉",
      },
    };
    return abouts[gameType] || abouts.jodi;
  };

  const renderDigitSelection = () => {
    if (!formData.gameType) {
      return (
        <div className="text-center py-10">
          <div className="text-5xl mb-3 opacity-30">👆</div>
          <p className="text-gray-400 font-medium">Select a game type</p>
          <p className="text-xs text-gray-300">Then choose your digits</p>
        </div>
      );
    }

    if (formData.gameType === "half-sangam") {
      return (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsHalfSangamMode("triple");
                setSelectedDigits([]);
                setCurrentDigitIndex(0);
                setFormData((prev) => ({ ...prev, number: "" }));
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                isHalfSangamMode === "triple"
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              Panna + Digit
              <span className="block text-[10px] font-normal mt-0.5">
                123-5
              </span>
            </button>
          </div>

          {renderDigitsGrid()}
        </div>
      );
    }

    return renderDigitsGrid();
  };

  const renderDigitsGrid = () => {
    const count = getDigitsCount(formData.gameType);
    const labels = getDigitLabels(formData.gameType);
    const isComplete = isAllDigitsSelected();

    return (
      <div>
        {/* STEP 1 header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
          <h3 className="text-sm font-bold text-gray-700">
            STEP 1: SELECT {getGameTypeDisplay(formData.gameType).toUpperCase()}{" "}
            ({count} NUMBERS)
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {formData.gameType === "half-sangam"
            ? `Select ${isHalfSangamMode === "single" ? "1 digit + 3-digit Panna" : "3-digit Panna + 1 digit"}`
            : formData.gameType === "full-sangam"
              ? "Select 3-digit Open Panna + 3-digit Close Panna"
              : `Select any ${count} numbers from 0 to 9`}
        </p>

        {/* Selected digits display */}
        <div className="flex items-center justify-center gap-4 mb-5">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="text-center">
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  selectedDigits[i] !== null && selectedDigits[i] !== undefined
                    ? "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-white"
                    : i === currentDigitIndex
                      ? "border-amber-400 bg-amber-50 text-gray-400"
                      : "border-gray-200 bg-gray-50 text-gray-300"
                }`}
              >
                {selectedDigits[i] !== null && selectedDigits[i] !== undefined
                  ? selectedDigits[i]
                  : "?"}
              </div>
              {labels[i] && (
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  {labels[i]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Digit grid */}
        <div className="grid grid-cols-5 gap-2.5 max-w-[280px] mx-auto">
          {digits.map((digit) => {
            const preventDuplicate = ![
              "panna",
              "half-sangam",
              "full-sangam",
            ].includes(formData.gameType);

            const isSelected =
              preventDuplicate && selectedDigits.some((d) => d === digit);

            return (
              <button
                key={digit}
                type="button"
                onClick={() => !isSelected && handleDigitSelect(digit)}
                disabled={isSelected || isComplete}
                className={`
                  w-11 h-11 rounded-full font-mono font-bold text-lg transition-all duration-200
                  ${
                    isSelected
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-95"
                      : isComplete
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                        : "bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:scale-110 active:scale-95"
                  }
                `}
              >
                {digit}
              </button>
            );
          })}
        </div>

        {/* Selected number display */}
        {isComplete && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-5 py-2">
              <span className="text-xs text-gray-500 font-medium">
                SELECTED {getGameTypeDisplay(formData.gameType).toUpperCase()}
              </span>
              <span className="text-xl font-extrabold text-amber-600 font-mono tracking-wider">
                {formData.number}
              </span>
              <button
                type="button"
                onClick={resetSelection}
                className="p-0.5 rounded-full hover:bg-amber-200/50 transition-colors"
              >
                <X size={16} className="text-amber-400" />
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-3">
          Format:{" "}
          <span className="font-medium text-gray-500">
            {getNumberHint(formData.gameType)}
          </span>
        </p>

        {/* About section */}
        {formData.gameType && (
          <div className="mt-5 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <Award
                size={18}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-amber-700">
                  {getAboutText(formData.gameType).title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {getAboutText(formData.gameType).desc}
                </p>
                <p className="text-xs font-medium text-amber-600 mt-1.5 bg-white/70 rounded-lg px-3 py-1.5 border border-amber-100">
                  💡 {getAboutText(formData.gameType).example}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (marketLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
      </div>
    );
  }

  if (!currentMarket) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-600 font-semibold">Market not found</p>
          <button
            onClick={() => navigate("/matka/markets")}
            className="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            ← Back to Markets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 px-4 py-4">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate("/matka/markets")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-all text-sm mb-4 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to Markets</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left - 3/5 */}
          <div className="lg:col-span-3 space-y-4">
            {/* ===== MARKET HEADER - CLEAN VERSION ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-stretch">
                {/* LEFT - Market Name (Full Height Gradient Panel) */}
                <div
                  className="relative w-28 flex-shrink-0 bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex flex-col items-center justify-center gap-2 py-5 overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                    <img
                      src={currentMarket.image}
                      alt=""
                      className="h-full w-full rounded-full"
                    />
                  </div>
                  <h1 className="text-white font-extrabold text-base tracking-wide text-center leading-tight">
                    {currentMarket.name}
                  </h1>
                  {currentMarket.isActive && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/90 text-white flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>

                {/* RIGHT - All Info (Two Rows) */}
                <div className="flex-1 flex flex-col">
                  {/* Row 1: Open / Close / Result */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">
                        Open Time
                      </p>
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-green-500" />
                        <span className="text-[11px] font-bold text-gray-700">
                          {currentMarket.openTime}
                        </span>
                      </div>
                    </div>

                    <div className="w-px h-7 bg-gray-100 flex-shrink-0"></div>

                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">
                        Close Time
                      </p>
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-red-400" />
                        <span className="text-[11px] font-bold text-gray-700">
                          {currentMarket.closeTime}
                        </span>
                      </div>
                    </div>

                    <div className="w-px h-7 bg-gray-100 flex-shrink-0"></div>

                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">
                        Result Time
                      </p>
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-amber-500" />
                        <span className="text-[11px] font-bold text-gray-700">
                          {currentMarket.resultTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Row 2: Today's Result / Last Result / Last Updated */}
                  <div className="flex items-center justify-between px-2 py-3 gap-2">
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                        Today's Result
                      </p>
                      <div className="flex items-center gap-1.5">
                        {resultsLoading && todayResult.length === 0 ? (
                          <div className="w-7 h-7 rounded-xl bg-gray-100 border border-gray-200 animate-pulse" />
                        ) : todayResult.length > 0 ? (
                          todayResult.map((digit, index) => (
                            <div
                              key={index}
                              className="w-7 h-7 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex items-center justify-center text-white font-extrabold text-base"
                            >
                              {digit}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-300 font-semibold">
                            Awaited
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-px h-12 bg-gray-100 flex-shrink-0"></div>

                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                        Last Result
                      </p>
                      <div className="flex items-center gap-1.5">
                        {resultsLoading && lastResult.length === 0 ? (
                          <div className="w-7 h-7 rounded-xl bg-gray-100 border border-gray-200 animate-pulse" />
                        ) : lastResult.length > 0 ? (
                          lastResult.map((digit, index) => (
                            <div
                              key={index}
                              className="w-7 h-7 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-extrabold text-base"
                            >
                              {digit}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-300 font-semibold">
                            —
                          </span>
                        )}
                      </div>
                      {lastResultDateKey && (
                        <p className="text-[8px] text-gray-300 font-semibold">
                          {formatShortDate(lastResultDateKey)}
                        </p>
                      )}
                    </div>

                    <div className="w-px h-12 bg-gray-100 flex-shrink-0"></div>

                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">
                        Updated
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-amber-600">
                          now
                        </span>
                        <RefreshCw
                          size={10}
                          className="text-amber-400 animate-spin-slow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Number Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              {!marketDigitType ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-bold text-red-500">
                    Market digit type is missing
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Configure this market as 2-digit or 3-digit from admin.
                  </p>
                </div>
              ) : !formData.gameType ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-bold text-gray-500">
                    Select a game from the market page
                  </p>
                  <p className="mt-1 text-xs text-gray-300">
                    Available games are automatically based on {marketDigitType}
                    .
                  </p>
                </div>
              ) : (
                renderDigitSelection()
              )}
            </div>
          </div>

          {/* Right - 2/5 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-4">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Coins size={18} className="text-amber-500" />
                STEP 2: SELECT COIN AMOUNT
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Choose how many coins you want to play
              </p>
              <p className="text-[10px] text-gray-400 mb-3">
                Range: {formatCurrency(currentMarket.minBid)} —{" "}
                {formatCurrency(currentMarket.maxBid)}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Coin Amount Buttons - dynamic, based on market's minBid/maxBid */}
                  <div className="grid grid-cols-3 gap-2">
                    {bidAmountOptions.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleBidAmountClick(amount)}
                        className={`
                          py-2.5 rounded-xl text-sm font-bold transition-all border-2
                          ${
                            formData.bidAmount === amount.toString()
                              ? "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50"
                          }
                        `}
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div>
                    {!isCustomAmount ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomAmount(true);
                          setCustomAmountError("");
                          setFormData({ ...formData, bidAmount: "" });
                        }}
                        className="w-full py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Coins size={14} />
                        Enter Custom Amount
                      </button>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                              {currencySymbol}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoFocus
                              value={formData.bidAmount}
                              onChange={handleCustomAmountChange}
                              placeholder={`${currentMarket.minBid} - ${currentMarket.maxBid}`}
                              className={`w-full pl-7 pr-3 py-2.5 rounded-xl text-sm font-bold border-2 outline-none transition-all ${
                                customAmountError
                                  ? "border-red-300 focus:border-red-400 text-red-600"
                                  : "border-amber-300 focus:border-amber-500 text-gray-700"
                              }`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomAmount(false);
                              setCustomAmountError("");
                              setFormData({ ...formData, bidAmount: "" });
                            }}
                            className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {customAmountError ? (
                          <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} /> {customAmountError}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            Min {formatCurrency(currentMarket.minBid)} · Max{" "}
                            {formatCurrency(currentMarket.maxBid)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Potential Win */}
                  {formData.bidAmount &&
                    formData.gameType &&
                    formData.number && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                        <p className="text-xs font-bold text-gray-600 mb-2">
                          POSSIBLE WINNING (APPROX.)
                        </p>
                        <div className="flex justify-between text-sm">
                          <div>
                            <p className="text-[10px] text-gray-400">
                              BET AMOUNT
                            </p>
                            <p className="font-bold text-gray-700">
                              {formatCurrency(parseFloat(formData.bidAmount))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">
                              YOU WILL WIN (APPROX.)
                            </p>
                            <p className="font-extrabold text-green-600 text-lg">
                              {formatCurrency(calculateWinAmount())}
                              <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full ml-1.5 align-middle">
                                {getMultiplierDisplay(formData.gameType)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2">
                          * Winning coins may vary as per market rules.
                        </p>
                      </div>
                    )}

                  {localError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={14} /> {localError}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2">
                      <Check size={14} /> {success}
                    </div>
                  )}

                  {/* Bottom Bar */}
                  {formData.bidAmount && formData.number && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-[10px] text-gray-400">
                            YOUR COINS
                          </p>
                          <p className="font-bold text-gray-700">
                            {formatCurrency(user?.balance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">YOUR BET</p>
                          <p className="font-bold text-amber-600">
                            {formatCurrency(
                              parseFloat(formData.bidAmount) || 0,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">
                            POSSIBLE WIN
                          </p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(calculateWinAmount())}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      bidLoading || !formData.number || !formData.bidAmount
                    }
                    className="w-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] py-3.5 rounded-xl text-black font-bold text-base shadow-amber-200 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bidLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Zap size={18} />
                        CONFIRM & PLAY
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>

                  {/* Trust badges */}
                  <div className="flex justify-center gap-4 text-[10px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      🔒 100% Fair Play
                    </span>
                    <span className="flex items-center gap-1">🛡️ Secured</span>
                    <span className="flex items-center gap-1">
                      ⚡ Instant Results
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PlaceBid;
