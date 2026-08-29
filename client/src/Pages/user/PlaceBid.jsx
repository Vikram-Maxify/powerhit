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

// =========================================================
// GAME TYPE MAPPING - CRITICAL FIX
// Frontend uses lowercase, backend expects PascalCase
// =========================================================
const GAME_TYPE_MAP = {
  // Frontend key -> Backend value
  single: "single",
  jodi: "jodi",
  panna: "panna",
  "single-patti": "single-Patti",
  "double-patti": "double-Patti",
  "triple-patti": "triple-Patti",
  "half-sangam": "half-sangam",
  "full-sangam": "full-sangam",
  "last-digit": "last-digit",
  "first-digit": "first-digit",
};

// Reverse map for display purposes
const GAME_TYPE_DISPLAY = {
  single: "Single",
  jodi: "Jodi",
  panna: "Panna",
  "single-Patti": "Single Patti",
  "double-Patti": "Double Patti",
  "triple-Patti": "Triple Patti",
  "half-sangam": "Half-Sangam",
  "full-sangam": "Full-Sangam",
  "last-digit": "Last Digit",
  "first-digit": "First Digit",
};

// Get backend game type from frontend type
const getBackendGameType = (frontendType) => {
  return GAME_TYPE_MAP[frontendType] || frontendType;
};

// Get display name for game type
const getGameTypeDisplayName = (type) => {
  return GAME_TYPE_DISPLAY[type] || type;
};

// Get display name from frontend type
const getDisplayFromFrontend = (frontendType) => {
  const backendType = getBackendGameType(frontendType);
  return GAME_TYPE_DISPLAY[backendType] || frontendType;
};

// Generates round, human-friendly bid amounts between minBid and maxBid.
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

// Returns a YYYY-MM-DD key for a date string, normalized to IST
const toISTDateKey = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const formatShortDate = (dateKey) => {
  if (!dateKey) return "";
  const d = new Date(`${dateKey}T00:00:00`);
  return d
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    .toUpperCase();
};

// =========================================================
// PATTI HELPERS
// =========================================================

const isSinglePatti = (num) => {
  const digits = num.toString().padStart(3, "0").split("");
  return (
    digits[0] !== digits[1] &&
    digits[1] !== digits[2] &&
    digits[0] !== digits[2]
  );
};

const isDoublePatti = (num) => {
  const digits = num.toString().padStart(3, "0").split("");
  return (
    (digits[0] === digits[1] && digits[1] !== digits[2]) ||
    (digits[0] === digits[2] && digits[1] !== digits[2]) ||
    (digits[1] === digits[2] && digits[0] !== digits[1])
  );
};

const isTriplePatti = (num) => {
  const digits = num.toString().padStart(3, "0").split("");
  return digits[0] === digits[1] && digits[1] === digits[2];
};

const getPattiType = (num) => {
  const str = num.toString().padStart(3, "0");
  if (isTriplePatti(num)) return "triple";
  if (isDoublePatti(num)) return "double";
  if (isSinglePatti(num)) return "single";
  return "unknown";
};

const buildPattiNumber = (digits, pattiType) => {
  const str = digits.join("");

  if (pattiType === "single-patti") {
    const unique = [...new Set(digits)];
    if (unique.length !== 3) return null;
    return str;
  }

  if (pattiType === "double-patti") {
    const counts = {};
    digits.forEach((d) => (counts[d] = (counts[d] || 0) + 1));
    const values = Object.values(counts);
    if (values.includes(2) && values.includes(1) && values.length === 2) {
      return str;
    }
    return null;
  }

  if (pattiType === "triple-patti") {
    if (digits[0] === digits[1] && digits[1] === digits[2]) {
      return str;
    }
    return null;
  }

  return str;
};

const getPattiTypeLabel = (type) => {
  const labels = {
    "single-patti": "Single Patti",
    "double-patti": "Double Patti",
    "triple-patti": "Triple Patti",
  };
  return labels[type] || type;
};

const getPattiTypeShort = (type) => {
  const labels = {
    "single-patti": "Single",
    "double-patti": "Double",
    "triple-patti": "Triple",
  };
  return labels[type] || type;
};

const getPattiTypeIcon = (type) => {
  const icons = {
    "single-patti": "🔢",
    "double-patti": "🔢",
    "triple-patti": "🔢",
  };
  return icons[type] || "🎲";
};

const isValidPattiNumber = (digits, pattiType) => {
  const str = digits.join("");
  if (str.length !== 3) return false;
  const num = parseInt(str, 10);

  if (pattiType === "single-patti") return isSinglePatti(num);
  if (pattiType === "double-patti") return isDoublePatti(num);
  if (pattiType === "triple-patti") return isTriplePatti(num);
  return true;
};

const getPattiDescription = (type) => {
  const descriptions = {
    "single-patti": "All 3 digits must be different (e.g., 123, 456, 789)",
    "double-patti": "Exactly 2 digits must be same (e.g., 112, 121, 211)",
    "triple-patti": "All 3 digits must be same (e.g., 111, 222, 999)",
  };
  return descriptions[type] || "";
};

const getPattiExample = (type) => {
  const examples = {
    "single-patti": "123, 456, 789, 012, 345",
    "double-patti": "112, 121, 211, 001, 100",
    "triple-patti": "111, 222, 333, 444, 999",
  };
  return examples[type] || "";
};

// =========================================================
// MAIN COMPONENT
// =========================================================

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

  const { gameType: autoGameType, digitType: autoDigitType } =
    location.state || {};

  const marketDigitType =
    currentMarket?.digitType ||
    currentMarket?.marketType ||
    autoDigitType ||
    "";

  // FRONTEND GAME TYPES (lowercase for UI)
  const allowedGameTypesByDigitType = useMemo(() => {
    if (marketDigitType === "2-digit") {
      return ["single", "jodi", "last-digit", "first-digit"];
    }

    if (marketDigitType === "3-digit") {
      return [
        "single",
        "single-patti",
        "double-patti",
        "triple-patti",
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

  // formData uses FRONTEND game types (lowercase)
  const [formData, setFormData] = useState({
    number: "",
    bidAmount: "",
    gameType: autoGameType || "",
  });

  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const [isHalfSangamMode, setIsHalfSangamMode] = useState("triple");
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountError, setCustomAmountError] = useState("");

  const bidAmountOptions = useMemo(
    () => generateBidAmounts(currentMarket?.minBid, currentMarket?.maxBid),
    [currentMarket?.minBid, currentMarket?.maxBid],
  );

  useEffect(() => {
    dispatch(
      fetchPublicBidResults({
        gameType: "panna",
        status: "all",
      }),
    );
  }, [dispatch]);

  const { todayResult, lastResult, lastResultDateKey } = useMemo(() => {
    if (!publicResults || publicResults.length === 0) {
      return { todayResult: [], lastResult: [], lastResultDateKey: null };
    }

    const marketResults = publicResults.filter((r) => r.resultNumber);

    const sorted = [...marketResults].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

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

    const prevDateKey = sortedDateKeys.find((key) => key !== todayKey);
    const prevEntry = prevDateKey ? byDate.get(prevDateKey) : null;

    return {
      todayResult: todayEntry ? todayEntry.resultNumber.split("") : [],
      lastResult: prevEntry ? prevEntry.resultNumber.split("") : [],
      lastResultDateKey: prevDateKey || null,
    };
  }, [publicResults]);

  const getDigitsCount = (gameType) => {
    if (gameType === "half-sangam") {
      return 4;
    }

    if (gameType === "full-sangam") {
      return 6;
    }

    const counts = {
      jodi: 2,
      panna: 3,
      "single-patti": 3,
      "double-patti": 3,
      "triple-patti": 3,
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
      "single-patti": ["H", "T", "U"],
      "double-patti": ["H", "T", "U"],
      "triple-patti": ["H", "T", "U"],
      "last-digit": ["T", "U"],
      "first-digit": ["T", "U"],
    };

    return labels[gameType] || ["Digit"];
  };

  const buildGameNumber = (gameType, digits) => {
    const values = digits.map((d) => d ?? "");

    if (["single-patti", "double-patti", "triple-patti"].includes(gameType)) {
      const number = values.join("");
      if (number.length !== 3) return "";

      if (gameType === "single-patti" && !isSinglePatti(parseInt(number, 10))) {
        return "";
      }
      if (gameType === "double-patti" && !isDoublePatti(parseInt(number, 10))) {
        return "";
      }
      if (gameType === "triple-patti" && !isTriplePatti(parseInt(number, 10))) {
        return "";
      }
      return number;
    }

    if (gameType === "half-sangam") {
      if (isHalfSangamMode === "single") {
        return `${values[0]}-${values.slice(1, 4).join("")}`;
      }
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
      "single-patti": "123, 456, 789",
      "double-patti": "112, 121, 211",
      "triple-patti": "111, 222, 333",
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
    const newSelected = [...selectedDigits];
    newSelected[currentDigitIndex] = digit;
    setSelectedDigits(newSelected);
    const count = getDigitsCount(formData.gameType);
    if (currentDigitIndex < count - 1) {
      setCurrentDigitIndex(currentDigitIndex + 1);
    }

    const number = buildGameNumber(formData.gameType, newSelected);
    setFormData({
      ...formData,
      number: number,
    });

    if (
      ["single-patti", "double-patti", "triple-patti"].includes(
        formData.gameType,
      )
    ) {
      const fullNumber = newSelected.join("");
      if (fullNumber.length === 3) {
        const num = parseInt(fullNumber, 10);
        let isValid = true;
        if (formData.gameType === "single-patti") isValid = isSinglePatti(num);
        else if (formData.gameType === "double-patti")
          isValid = isDoublePatti(num);
        else if (formData.gameType === "triple-patti")
          isValid = isTriplePatti(num);

        if (!isValid) {
          const typeLabel = getPattiTypeLabel(formData.gameType);
          setLocalError(
            `Invalid number for ${typeLabel}. Please select correct digits.`,
          );
        } else {
          setLocalError("");
        }
      }
    }
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
    setLocalError("");
  };

  const resetSelection = () => {
    setSelectedDigits([]);
    setCurrentDigitIndex(0);
    setFormData({ ...formData, number: "" });
    setLocalError("");
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

    // CRITICAL FIX: Convert frontend game type to backend game type
    const backendGameType = getBackendGameType(formData.gameType);

    const result = await dispatch(
      placeBid({
        marketId,
        gameType: backendGameType, // Send the correct backend format
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
      "single-patti": "Single Patti",
      "double-patti": "Double Patti",
      "triple-patti": "Triple Patti",
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
      "single-patti": "🔢",
      "double-patti": "🔢",
      "triple-patti": "🔢",
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
      "single-patti": 90,
      "double-patti": 90,
      "triple-patti": 90,
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
      "single-patti": "90x",
      "double-patti": "90x",
      "triple-patti": "90x",
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
      "single-patti":
        "Match the exact three-digit number with all different digits",
      "double-patti":
        "Match the exact three-digit number with exactly two same digits",
      "triple-patti": "Match the exact three-digit number with all same digits",
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
      "single-patti": {
        title: "ABOUT SINGLE PATTI",
        desc: "Select three different digits (e.g., 123, 456, 789). All digits must be unique.",
        example:
          "Result: 4 6 8 → You selected: 4 6 8 → All match → You Win! 🎉",
      },
      "double-patti": {
        title: "ABOUT DOUBLE PATTI",
        desc: "Select three digits where exactly two are the same (e.g., 112, 121, 211).",
        example:
          "Result: 1 1 2 → You selected: 1 1 2 → All match → You Win! 🎉",
      },
      "triple-patti": {
        title: "ABOUT TRIPLE PATTI",
        desc: "Select three identical digits (e.g., 111, 222, 333, 999).",
        example:
          "Result: 1 1 1 → You selected: 1 1 1 → All match → You Win! 🎉",
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
            <button
              type="button"
              onClick={() => {
                setIsHalfSangamMode("single");
                setSelectedDigits([]);
                setCurrentDigitIndex(0);
                setFormData((prev) => ({ ...prev, number: "" }));
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                isHalfSangamMode === "single"
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              Digit + Panna
              <span className="block text-[10px] font-normal mt-0.5">
                5-123
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

    const isPattiGame = [
      "single-patti",
      "double-patti",
      "triple-patti",
    ].includes(formData.gameType);

    return (
      <div>
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
              : isPattiGame
                ? `Select 3 digits for ${getPattiTypeLabel(formData.gameType)} (${getPattiDescription(formData.gameType)})`
                : `Select any ${count} numbers from 0 to 9`}
        </p>

        {isPattiGame && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-medium text-blue-700">
              📌 {getPattiTypeLabel(formData.gameType)} Pattern
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Examples: {getPattiExample(formData.gameType)}
            </p>
          </div>
        )}

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

        <div className="grid grid-cols-5 gap-2.5 max-w-[280px] mx-auto">
          {digits.map((digit) => {
            const preventDuplicate = ![
              "panna",
              "half-sangam",
              "full-sangam",
              "single-patti",
              "double-patti",
              "triple-patti",
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
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-stretch">
                <div className="relative w-28 flex-shrink-0 bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex flex-col items-center justify-center gap-2 py-5 overflow-hidden">
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

                <div className="flex-1 flex flex-col">
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
              ) : (
                <>
                  {formData.gameType ? (
                    renderDigitSelection()
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm font-bold text-gray-400">
                        Please select a game type above
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

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
