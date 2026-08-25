// GameSelection.jsx - Amber/Orange/Yellow Theme with Multi-Country Support & Dynamic Currency

import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  Crown,
  Diamond,
  Flame,
  Gift,
  Home,
  Package,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCircle,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

// Import country-specific game count slices
import { getGameCounts as getAustraliaGameCounts } from "../redux/slices/australia/gameCountSlice";
import { getGameCounts as getCanadaGameCounts } from "../redux/slices/canada/gameCountSlice";
import { getGameCounts as getIndiaGameCounts } from "../redux/slices/india/gameCountSlice";
import { getGameCounts as getNepalGameCounts } from "../redux/slices/nepal/gameCountSlice";
import { getGameCounts as getPakistanGameCounts } from "../redux/slices/pakistan/gameCountSlice";
import { getGameCounts as getUaeGameCounts } from "../redux/slices/uae/gameCountSlice";

import {
  createGameEntry,
  resetGameEntryState,
} from "../redux/slices/gameEntrySlice";
import { getUserTicketTypes } from "../redux/slices/ticketTypeSlice";

// Countries data
const countries = [
  { name: "India", flag: "https://flagcdn.com/w80/in.png", code: "IN" },
  { name: "Australia", flag: "https://flagcdn.com/w80/au.png", code: "AU" },
  { name: "Pakistan", flag: "https://flagcdn.com/w80/pk.png", code: "PK" },
  { name: "Canada", flag: "https://flagcdn.com/w80/ca.png", code: "CA" },
  { name: "Nepal", flag: "https://flagcdn.com/w80/np.png", code: "NP" },
  { name: "Dubai", flag: "https://flagcdn.com/w80/ae.png", code: "UAE" },
];

// ==========================================
// CURRENCY CONFIGURATION
// ==========================================
const currencyConfig = {
  IN: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  AU: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  PK: { symbol: "₨", code: "PKR", name: "Pakistani Rupee" },
  CA: { symbol: "C$", code: "CAD", name: "Canadian Dollar" },
  NP: { symbol: "रू", code: "NPR", name: "Nepalese Rupee" },
  UAE: { symbol: "د.إ", code: "AED", name: "UAE Dirham" },
};

// Helper function to get currency symbol
const getCurrencySymbol = (countryCode) => {
  return currencyConfig[countryCode]?.symbol || "₹";
};

// Helper function to format price with currency
const formatPrice = (amount, countryCode) => {
  const symbol = getCurrencySymbol(countryCode);
  return `${symbol}${amount}`;
};

// ===== CUSTOM MODAL COMPONENT =====
const CustomModal = ({ isOpen, onClose, type, title, message, details }) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-300 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative p-6 text-center ${isSuccess ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-red-500 to-rose-600"}`}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
          >
            <X size={19} />
          </button>
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
            <span className="text-4xl">{isSuccess ? "✅" : "❌"}</span>
          </div>
          <h3 className="text-2xl font-black text-white">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-center text-lg font-semibold text-gray-700">
            {message}
          </p>
          {details && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="break-all font-mono text-xs text-gray-600">
                {details}
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className={`mt-5 w-full rounded-xl py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 ${isSuccess ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-red-500 to-rose-600"}`}
          >
            {isSuccess ? "🎉 Great!" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== TICKET INFO TOOLTIP =====
const TicketInfoTooltip = ({ ticket }) => {
  if (!ticket) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl z-50 border border-gray-700">
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
      <div className="space-y-1.5">
        <p className="flex justify-between">
          <span className="text-gray-400">ID:</span>
          <span className="font-mono text-[10px]">{ticket._id}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-400">Title:</span>
          <span className="font-semibold">{ticket.title}</span>
        </p>
        {ticket.subTitle && (
          <p className="flex justify-between">
            <span className="text-gray-400">Subtitle:</span>
            <span>{ticket.subTitle}</span>
          </p>
        )}
        <p className="flex justify-between">
          <span className="text-gray-400">Order:</span>
          <span>{ticket.order}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span>{ticket.isActive ? "🟢 Active" : "🔴 Inactive"}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-400">Game Types:</span>
          <span>{ticket.gameTypes?.length || 0}</span>
        </p>
        {ticket.gameTypes && ticket.gameTypes.length > 0 && (
          <div className="mt-1 pt-1 border-t border-gray-700">
            <p className="text-gray-400 text-[10px] mb-0.5">Game Types:</p>
            {ticket.gameTypes.map((gt, idx) => (
              <div key={gt._id} className="flex justify-between text-[10px]">
                <span>{gt.title}</span>
                <span className="text-gray-500">
                  {gt.isActive ? "✅" : "❌"} Order: {gt.order}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-700">
          <span>
            Created: {new Date(ticket.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
          </span>
        </p>
      </div>
    </div>
  );
};

const GameSelection = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const urlCountry = searchParams.get("country");

  const { user } = useSelector((state) => state.auth || { user: null });
  const userCountry = user?.country || null;

  const activeCountryName = urlCountry || userCountry;

  // ==========================================
  // COUNTRY CONFIGURATION
  // ==========================================

  const countryConfig = {
    india: {
      stateKey: "indiaGameCount",
      getGameCounts: getIndiaGameCounts,
      countryCode: "IN",
      displayName: "India",
    },
    australia: {
      stateKey: "australiaGameCount",
      getGameCounts: getAustraliaGameCounts,
      countryCode: "AU",
      displayName: "Australia",
    },
    pakistan: {
      stateKey: "pakistanGameCount",
      getGameCounts: getPakistanGameCounts,
      countryCode: "PK",
      displayName: "Pakistan",
    },
    canada: {
      stateKey: "canadaGameCount",
      getGameCounts: getCanadaGameCounts,
      countryCode: "CA",
      displayName: "Canada",
    },
    nepal: {
      stateKey: "nepalGameCount",
      getGameCounts: getNepalGameCounts,
      countryCode: "NP",
      displayName: "Nepal",
    },
    dubai: {
      stateKey: "uaeGameCount",
      getGameCounts: getUaeGameCounts,
      countryCode: "UAE",
      displayName: "Dubai",
    },
    uae: {
      stateKey: "uaeGameCount",
      getGameCounts: getUaeGameCounts,
      countryCode: "UAE",
      displayName: "UAE",
    },
  };

  // ==========================================
  // NORMALIZE COUNTRY
  // User country can be:
  // India / india / IN
  // Australia / australia / AU
  // Pakistan / pakistan / PK
  // Canada / canada / CA
  // Nepal / nepal / NP
  // UAE / uae / dubai / AE
  // ==========================================
  const countryAliases = {
    india: "india",
    in: "india",

    australia: "australia",
    au: "australia",

    pakistan: "pakistan",
    pk: "pakistan",

    canada: "canada",
    ca: "canada",

    nepal: "nepal",
    np: "nepal",

    uae: "uae",
    ae: "uae",
    dubai: "uae",
  };

  const normalizedCountry =
    countryAliases[
      String(activeCountryName || "")
        .trim()
        .toLowerCase()
    ] || "";

  const activeCountryConfig = countryConfig[normalizedCountry] || null;

  // ==========================================
  // REDUX SELECTORS
  // ==========================================

  const { ticketTypes = [], loading: ticketLoading } = useSelector(
    (state) => state.ticketType || {},
  );

  // Get all game counts from all country slices
  const indiaGameCounts = useSelector(
    (state) => state.indiaGameCount?.gameCounts || [],
  );
  const australiaGameCounts = useSelector(
    (state) => state.australiaGameCount?.gameCounts || [],
  );
  const pakistanGameCounts = useSelector(
    (state) => state.pakistanGameCount?.gameCounts || [],
  );
  const canadaGameCounts = useSelector(
    (state) => state.canadaGameCount?.gameCounts || [],
  );
  const nepalGameCounts = useSelector(
    (state) => state.nepalGameCount?.gameCounts || [],
  );
  const uaeGameCounts = useSelector(
    (state) => state.uaeGameCount?.gameCounts || [],
  );

  // Get the correct game counts based on active country
  const getGameCountsByCountry = () => {
    if (!activeCountryConfig) return [];

    switch (activeCountryConfig.stateKey) {
      case "indiaGameCount":
        return indiaGameCounts;
      case "australiaGameCount":
        return australiaGameCounts;
      case "pakistanGameCount":
        return pakistanGameCounts;
      case "canadaGameCount":
        return canadaGameCounts;
      case "nepalGameCount":
        return nepalGameCounts;
      case "uaeGameCount":
        return uaeGameCounts;
      default:
        return [];
    }
  };

  const gameCounts = getGameCountsByCountry();

  // Get loading states at the top level.
  // Do NOT call useSelector conditionally or inside helper functions.
  const indiaGameCountLoading = useSelector(
    (state) => state.indiaGameCount?.loading || false,
  );
  const australiaGameCountLoading = useSelector(
    (state) => state.australiaGameCount?.loading || false,
  );
  const pakistanGameCountLoading = useSelector(
    (state) => state.pakistanGameCount?.loading || false,
  );
  const canadaGameCountLoading = useSelector(
    (state) => state.canadaGameCount?.loading || false,
  );
  const nepalGameCountLoading = useSelector(
    (state) => state.nepalGameCount?.loading || false,
  );
  const uaeGameCountLoading = useSelector(
    (state) => state.uaeGameCount?.loading || false,
  );

  const loadingByCountry = {
    indiaGameCount: indiaGameCountLoading,
    australiaGameCount: australiaGameCountLoading,
    pakistanGameCount: pakistanGameCountLoading,
    canadaGameCount: canadaGameCountLoading,
    nepalGameCount: nepalGameCountLoading,
    uaeGameCount: uaeGameCountLoading,
  };

  const gameCountLoading = activeCountryConfig
    ? Boolean(loadingByCountry[activeCountryConfig.stateKey])
    : false;

  const {
    loading: entryLoading,
    success: entrySuccess,
    error: entryError,
    message: entryMessage,
  } = useSelector((state) => state.gameEntry || {});

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getCountryCodeFromName = (countryName) => {
    if (!countryName) return null;

    const value = String(countryName).trim().toLowerCase();

    const codeMap = {
      india: "IN",
      in: "IN",
      australia: "AU",
      au: "AU",
      pakistan: "PK",
      pk: "PK",
      canada: "CA",
      ca: "CA",
      nepal: "NP",
      np: "NP",
      uae: "UAE",
      ae: "UAE",
      dubai: "UAE",
    };

    return codeMap[value] || null;
  };

  const getCountryObject = (countryName) => {
    const code = getCountryCodeFromName(countryName);

    if (!code) return null;

    return countries.find((c) => c.code === code) || null;
  };

  const activeCountryCode = useMemo(() => {
    return getCountryCodeFromName(activeCountryName);
  }, [activeCountryName]);

  const activeCountryObject = useMemo(() => {
    return getCountryObject(activeCountryName);
  }, [activeCountryName]);

  // ==========================================
  // STATE DECLARATIONS
  // ==========================================

  const [activeTicket, setActiveTicket] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [selectedGameCount, setSelectedGameCount] = useState(null);
  const [games, setGames] = useState([]);
  const [selectionMode, setSelectionMode] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [drawCount, setDrawCount] = useState(1);
  const [expandedGame, setExpandedGame] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredTicket, setHoveredTicket] = useState(null);
  const [allGamesExpanded, setAllGamesExpanded] = useState(false);
  const [countryError, setCountryError] = useState(null);

  const [modal, setModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    details: null,
  });

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  const availableGameTypes = useMemo(() => {
    const ticket = ticketTypes.find((t) => t._id === activeTicket);
    if (ticket && ticket.gameTypes && ticket.gameTypes.length > 0) {
      return ticket.gameTypes.map((gt) => ({
        id: gt._id,
        title: gt.title,
        description: gt.description || "",
        order: gt.order,
        isActive: gt.isActive,
        fullObject: gt,
      }));
    }
    return [
      {
        id: "default",
        title: "Standard Game",
        description: "",
        order: 0,
        isActive: true,
        fullObject: null,
      },
    ];
  }, [ticketTypes, activeTicket]);

  // ==========================================
  // FILTER GAME COUNTS
  // IMPORTANT:
  // Mongo ObjectId can arrive as an object/string.
  // Always compare IDs as strings.
  // ==========================================
  const filteredGameCounts = useMemo(() => {
    if (!Array.isArray(gameCounts) || gameCounts.length === 0) {
      console.log("📊 No game counts available");
      return [];
    }

    const activeTicketId = String(activeTicket || "");

    if (!activeTicketId) {
      console.log("📊 Waiting for active ticket");
      return [];
    }

    const result = gameCounts.filter((item) => {
      const ticketId =
        item?.ticketType?._id ||
        item?.ticketType?.id ||
        item?.ticketType ||
        item?.ticketTypeId ||
        "";

      // FIX: ObjectId/string mismatch
      if (String(ticketId) !== activeTicketId) {
        return false;
      }

      // If ticket has no game type selection, return all packages
      if (!selectedGameType || selectedGameType === "default") {
        return true;
      }

      const gameTypeId =
        item?.gameType?._id ||
        item?.gameType?.id ||
        item?.gameType ||
        item?.gameTypeId ||
        item?.gameTypeDetails?._id ||
        "";

      return String(gameTypeId) === String(selectedGameType);
    });

    console.log("📊 Game counts from API:", gameCounts);
    console.log("🎟️ Active ticket:", activeTicketId);
    console.log("🎮 Selected game type:", selectedGameType);
    console.log("📊 Filtered game counts:", result);

    // ==========================================
    // FALLBACK:
    // If gameType does not match because backend
    // returned gameType as null/undefined, still
    // show the packages belonging to this ticket.
    // ==========================================
    if (result.length === 0 && gameCounts.length > 0) {
      const anyForTicket = gameCounts.filter((item) => {
        const ticketId =
          item?.ticketType?._id ||
          item?.ticketType?.id ||
          item?.ticketType ||
          item?.ticketTypeId ||
          "";

        return String(ticketId) === activeTicketId;
      });

      if (anyForTicket.length > 0) {
        console.log("🔄 Using ticket fallback:", anyForTicket);

        return anyForTicket;
      }
    }

    return result;
  }, [gameCounts, activeTicket, selectedGameType]);

  const selectedCount = useMemo(() => {
    if (selectedGameCount) {
      return (
        filteredGameCounts.find(
          (x) => String(x?._id) === String(selectedGameCount),
        ) || null
      );
    }

    if (filteredGameCounts.length > 0) {
      return filteredGameCounts[0];
    }

    return null;
  }, [filteredGameCounts, selectedGameCount]);

  const activeTicketTitle = useMemo(() => {
    const ticket = ticketTypes.find((t) => t._id === activeTicket);
    return ticket?.title || "Select Ticket";
  }, [ticketTypes, activeTicket]);

  const selectedGameTypeTitle = useMemo(() => {
    const gameType = availableGameTypes.find((g) => g.id === selectedGameType);
    return gameType?.title || "";
  }, [availableGameTypes, selectedGameType]);

  const selectedGameTypeOrder = useMemo(() => {
    const gameType = availableGameTypes.find((g) => g.id === selectedGameType);
    return gameType?.order;
  }, [availableGameTypes, selectedGameType]);

  const totalPrice = useMemo(() => {
    const basePrice = selectedCount?.price || 0;
    return basePrice * (autoPlay ? drawCount : 1);
  }, [selectedCount, autoPlay, drawCount]);

  const allGamesFilled = useMemo(() => {
    if (games.length === 0) return false;

    if (selectionMode === "quickpick") {
      return games.every(
        (game) =>
          game.numbers &&
          game.numbers.length === 7 &&
          game.powerball !== null &&
          game.powerball !== undefined,
      );
    }
    return games.every(
      (game) =>
        game.selectedNumbers &&
        game.selectedNumbers.length === 7 &&
        game.selectedPowerball !== null &&
        game.selectedPowerball !== undefined,
    );
  }, [games, selectionMode]);

  const isCountryValid = useMemo(() => {
    if (!activeCountryName) {
      setCountryError("Please set your country to play.");
      return false;
    }
    const countryObj = getCountryObject(activeCountryName);
    if (!countryObj) {
      setCountryError(
        `Country "${activeCountryName}" not found in our supported countries.`,
      );
      return false;
    }
    setCountryError(null);
    return true;
  }, [activeCountryName]);

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    dispatch(getUserTicketTypes());
  }, [dispatch]);

  // ==========================================
  // FETCH GAME COUNTS
  // COUNTRY + TICKET TYPE
  // ==========================================
  const lastGameCountRequest = useRef("");

  useEffect(() => {
    // Wait until country config is ready
    if (!activeCountryConfig) return;

    // Wait until country is normalized
    if (!normalizedCountry) return;

    // IMPORTANT:
    // Game counts are ticket-specific.
    // Do not call the API before a ticket is selected.
    if (!activeTicket) {
      console.log(
        "⏳ Waiting for active ticket before fetching game counts...",
      );
      return;
    }

    const ticketType = String(activeTicket).trim();

    if (!ticketType) return;

    // Prevent duplicate requests for the exact same
    // country + ticket combination.
    const requestKey = `${normalizedCountry}:${ticketType}`;

    if (lastGameCountRequest.current === requestKey) {
      return;
    }

    lastGameCountRequest.current = requestKey;

    console.log("=================================");
    console.log("🎟️ GAME COUNT FETCH");
    console.log("COUNTRY:", normalizedCountry);
    console.log("TICKET TYPE:", ticketType);
    console.log("REQUEST:", {
      ticketType,
    });
    console.log("=================================");

    dispatch(
      activeCountryConfig.getGameCounts({
        ticketType,
      }),
    );
  }, [dispatch, normalizedCountry, activeTicket, activeCountryConfig]);

  // Set initial ticket
  useEffect(() => {
    if (ticketTypes.length > 0 && !activeTicket) {
      if (urlCountry) {
        const matchingTicket = ticketTypes.find((ticket) =>
          String(ticket?.title || ticket?.name || "")
            .toLowerCase()
            .includes(String(urlCountry).toLowerCase()),
        );

        if (matchingTicket) {
          setActiveTicket(matchingTicket._id);
          return;
        }
      }

      const firstActiveTicket =
        ticketTypes.find((ticket) => ticket?.isActive !== false) ||
        ticketTypes[0];

      setActiveTicket(firstActiveTicket?._id || null);
    }
  }, [ticketTypes, activeTicket, urlCountry]);

  useEffect(() => {
    setSelectedGameType(null);
    setSelectedGameCount(null);
    setGames([]);
    setExpandedGame(null);
    setIsInitialized(false);
    setSelectionMode(null);
    setAllGamesExpanded(false);
  }, [activeTicket]);

  useEffect(() => {
    if (entrySuccess) {
      setShowSuccess(true);
      const selectedTicket = ticketTypes.find((t) => t._id === activeTicket);
      setModal({
        isOpen: true,
        type: "success",
        title: "🎉 Entry Created Successfully!",
        message:
          entryMessage ||
          "Your game entry has been added to cart successfully.",
        details: `Ticket: ${activeTicketTitle} (ID: ${selectedTicket?._id?.slice(-6) || "N/A"}) | Order: ${selectedTicket?.order || 0} | ${selectedCount?.totalGames || 0} Games | ${selectionMode === "quickpick" ? "QuickPick" : "Pick Your Numbers"} | Country: ${activeCountryName} (${activeCountryCode || "N/A"})`,
      });

      const timer = setTimeout(() => {
        closeModal();
        dispatch(resetGameEntryState());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [entrySuccess, dispatch]);

  useEffect(() => {
    if (entryError) {
      const errorMessage =
        typeof entryError === "string"
          ? entryError
          : entryError?.message || "Something went wrong. Please try again.";

      const isCountryError = errorMessage.toLowerCase().includes("country");

      setModal({
        isOpen: true,
        type: "error",
        title: isCountryError ? "🌍 Country Error" : "❌ Error Occurred",
        message: errorMessage,
        details: isCountryError
          ? `Active Country: ${activeCountryName || "Not Set"} (${activeCountryCode || "N/A"})`
          : null,
      });
    }
  }, [entryError, activeCountryName, activeCountryCode]);

  useEffect(() => {
    if (activeTicket && availableGameTypes.length > 0 && !selectedGameType) {
      setSelectedGameType(availableGameTypes[0].id);
    }
  }, [activeTicket, availableGameTypes, selectedGameType]);

  useEffect(() => {
    if (
      selectedGameType &&
      filteredGameCounts.length > 0 &&
      !selectedGameCount
    ) {
      setSelectedGameCount(filteredGameCounts[0]._id);
    }
  }, [selectedGameType, filteredGameCounts, selectedGameCount]);

  // ==========================================
  // MODAL FUNCTIONS
  // ==========================================

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    setShowSuccess(false);
    dispatch(resetGameEntryState());
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const generateRandomGameNumbers = () => {
    const numbers = [];
    while (numbers.length < 7) {
      const num = Math.floor(Math.random() * 35) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  };

  const generateRandomPowerball = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const initializeGames = (mode) => {
    const totalGames = selectedCount?.totalGames || 6;
    const newGames = [];

    for (let i = 0; i < totalGames; i++) {
      if (mode === "quickpick") {
        newGames.push({
          id: i + 1,
          numbers: generateRandomGameNumbers(),
          powerball: generateRandomPowerball(),
          selectedNumbers: [],
          selectedPowerball: null,
        });
      } else {
        newGames.push({
          id: i + 1,
          numbers: [],
          powerball: null,
          selectedNumbers: [],
          selectedPowerball: null,
        });
      }
    }

    setGames(newGames);
    setIsInitialized(true);

    if (mode === "pick") {
      setAllGamesExpanded(true);
    } else {
      setAllGamesExpanded(false);
    }
  };

  // ==========================================
  // GAME FUNCTIONS
  // ==========================================

  const toggleNumber = (gameIndex, num) => {
    if (selectionMode !== "pick") return;

    setGames((prev) => {
      const newGames = [...prev];
      const game = newGames[gameIndex];
      const currentNumbers = game.selectedNumbers || [];

      if (currentNumbers.includes(num)) {
        game.selectedNumbers = currentNumbers.filter((n) => n !== num);
      } else {
        if (currentNumbers.length >= 7) {
          setModal({
            isOpen: true,
            type: "error",
            title: "⚠️ Maximum Numbers Reached",
            message: "You can select maximum 7 numbers per game.",
            details: null,
          });
          return prev;
        }
        game.selectedNumbers = [...currentNumbers, num].sort((a, b) => a - b);

        if (game.selectedNumbers.length === 7 && !game.selectedPowerball) {
          game.selectedPowerball = generateRandomPowerball();
        }
      }

      return newGames;
    });
  };

  const togglePowerball = (gameIndex, num) => {
    if (selectionMode !== "pick") return;

    setGames((prev) => {
      const newGames = [...prev];
      const game = newGames[gameIndex];

      if (game.selectedPowerball === num) {
        game.selectedPowerball = null;
      } else {
        game.selectedPowerball = num;
      }

      return newGames;
    });
  };

  const autoFillGame = (gameIndex) => {
    if (selectionMode !== "pick") return;

    setGames((prev) => {
      const newGames = [...prev];
      const game = newGames[gameIndex];

      const numbers = generateRandomGameNumbers();
      game.selectedNumbers = numbers;

      if (!game.selectedPowerball) {
        game.selectedPowerball = generateRandomPowerball();
      }

      return newGames;
    });
  };

  const quickPickGame = (gameIndex) => {
    setGames((prev) => {
      const newGames = [...prev];
      const game = newGames[gameIndex];

      if (selectionMode === "pick") {
        const numbers = generateRandomGameNumbers();
        game.selectedNumbers = numbers;
        game.selectedPowerball = generateRandomPowerball();
      } else {
        const numbers = generateRandomGameNumbers();
        game.numbers = numbers;
        game.powerball = generateRandomPowerball();
      }

      return newGames;
    });
  };

  const clearGame = (gameIndex) => {
    if (selectionMode !== "pick") return;

    setGames((prev) => {
      const newGames = [...prev];
      const game = newGames[gameIndex];
      game.selectedNumbers = [];
      game.selectedPowerball = null;
      return newGames;
    });
  };

  const handleReshuffleAll = () => {
    setGames((prev) => {
      return prev.map((game) => {
        const numbers = generateRandomGameNumbers();
        if (selectionMode === "pick") {
          return {
            ...game,
            selectedNumbers: numbers,
            selectedPowerball: generateRandomPowerball(),
          };
        } else {
          return {
            ...game,
            numbers: numbers,
            powerball: generateRandomPowerball(),
          };
        }
      });
    });
  };

  const toggleExpand = (gameIndex) => {
    if (expandedGame === gameIndex) {
      setExpandedGame(null);
    } else {
      setExpandedGame(gameIndex);
    }
  };

  // ==========================================
  // HANDLE ADD TO CART
  // ==========================================

  const handleAddToCart = async () => {
    if (!activeCountryName) {
      setModal({
        isOpen: true,
        type: "error",
        title: "🌍 Country Not Set",
        message:
          "Please set your country before playing. Update your profile to continue.",
        details: "Go to Profile → Edit Profile → Select Country",
      });
      return;
    }

    const countryObj = getCountryObject(activeCountryName);
    if (!countryObj) {
      setModal({
        isOpen: true,
        type: "error",
        title: "🌍 Unsupported Country",
        message: `"${activeCountryName}" is not a supported country. Please select a valid country.`,
        details: `Supported countries: ${countries.map((c) => c.name).join(", ")}`,
      });
      return;
    }

    const countryCode = countryObj.code;

    if (!selectionMode) {
      setModal({
        isOpen: true,
        type: "error",
        title: "⚠️ Selection Mode Required",
        message:
          'Please select either "Pick Your Numbers" or "QuickPick" mode.',
        details: null,
      });
      return;
    }

    if (games.length === 0) {
      setModal({
        isOpen: true,
        type: "error",
        title: "⚠️ No Games",
        message: "No games to add. Please select a game mode first.",
        details: null,
      });
      return;
    }

    if (!allGamesFilled) {
      const incompleteGames = games.filter((g) => {
        if (selectionMode === "quickpick") {
          return !(g.numbers?.length === 7 && g.powerball);
        }
        return !(g.selectedNumbers?.length === 7 && g.selectedPowerball);
      });

      setModal({
        isOpen: true,
        type: "error",
        title: "⚠️ Incomplete Games",
        message: `Please fill all ${games.length} games with 7 numbers and a Powerball before adding to cart. ${incompleteGames.length} game(s) incomplete.`,
        details: null,
      });
      return;
    }

    if (!selectedCount || !selectedCount._id) {
      setModal({
        isOpen: true,
        type: "error",
        title: "⚠️ No Package Selected",
        message: "Please select a game package.",
        details: null,
      });
      return;
    }

    if (!activeTicket) {
      setModal({
        isOpen: true,
        type: "error",
        title: "⚠️ No Ticket Selected",
        message: "Please select a ticket type.",
        details: null,
      });
      return;
    }

    const gameData = games.map((game) => ({
      numbers:
        selectionMode === "quickpick" ? game.numbers : game.selectedNumbers,
      powerball:
        selectionMode === "quickpick" ? game.powerball : game.selectedPowerball,
    }));

    const isValid = gameData.every(
      (g) =>
        g.numbers &&
        g.numbers.length === 7 &&
        g.powerball !== null &&
        g.powerball !== undefined,
    );

    if (!isValid) {
      setModal({
        isOpen: true,
        type: "error",
        title: "⚠️ Invalid Game Data",
        message: "All games must have 7 numbers and a Powerball.",
        details: null,
      });
      return;
    }

    const payload = {
      ticketType: activeTicket,
      gameType: selectedGameType === "default" ? null : selectedGameType,
      gameCount: selectedCount._id,
      games: gameData,
      autoPlay: autoPlay,
      drawCount: autoPlay ? drawCount : 1,
      totalPrice: totalPrice,
      country: countryCode,
      countryName: activeCountryName,
      countryFlag: countryObj.flag,
    };

    try {
      await dispatch(createGameEntry(payload)).unwrap();
      setGames([]);
      setIsInitialized(false);
      setSelectionMode(null);
      setAllGamesExpanded(false);
    } catch (error) {
      console.error("Failed to create entry:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "Failed to create game entry. Please try again.";

      setModal({
        isOpen: true,
        type: "error",
        title: "❌ Submission Failed",
        message: errorMessage,
        details: null,
      });
    }
  };

  // ==========================================
  // UI HELPERS
  // ==========================================

  const getTicketIcon = (title) => {
    const lower = title?.toLowerCase() || "";
    if (lower.includes("platinum") || lower.includes("premium")) return Crown;
    if (lower.includes("vip")) return Diamond;
    if (lower.includes("powerhit")) return Zap;
    if (lower.includes("system")) return Gift;
    if (lower.includes("syndicate")) return Users;
    return Sparkles;
  };

  // Match the reference dashboard: once a valid package is selected,
  // show a ready-to-play QuickPick selection by default.
  useEffect(() => {
    if (selectedCount && !selectionMode && !isInitialized) {
      initializeGames("quickpick");
      setSelectionMode("quickpick");
    }
  }, [selectedCount, selectionMode, isInitialized]);

  // ==========================================
  // RENDER
  // ==========================================

  if (ticketLoading || gameCountLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf0]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-400 border-t-transparent animate-spin">
            <Crown className="text-amber-500" size={28} />
          </div>
          <p className="font-semibold text-gray-600">
            Loading your Wingox dashboard…
          </p>
        </div>
      </div>
    );
  }

  const referenceGame = games[0];
  const referenceNumbers =
    selectionMode === "quickpick"
      ? referenceGame?.numbers || []
      : referenceGame?.selectedNumbers || [];
  const referencePowerball =
    selectionMode === "quickpick"
      ? referenceGame?.powerball
      : referenceGame?.selectedPowerball;

  const displayNumbers = referenceNumbers.length
    ? referenceNumbers
    : [12, 24, 31, 45, 58, 63, 71];
  const displayPowerball = referencePowerball || 9;

  const ticketVisuals = [
    { icon: Sparkles, title: "STANDARD", subtitle: "Most Popular" },
    { icon: Zap, title: "POWERHIT", subtitle: "High Rewards" },
    { icon: Gift, title: "SYSTEM", subtitle: "Smart Play" },
    { icon: Users, title: "LOTTO PARTY", subtitle: "Group Play" },
  ];

  const selectGameType = (gameTypeId) => {
    setSelectedGameType(gameTypeId);
    setSelectedGameCount(null);
    setGames([]);
    setExpandedGame(null);
    setIsInitialized(false);
    setSelectionMode(null);
    setAllGamesExpanded(false);
  };

  const selectPackage = (packageId) => {
    setSelectedGameCount(packageId);
    setGames([]);
    setExpandedGame(null);
    setIsInitialized(false);
    setSelectionMode(null);
    setAllGamesExpanded(false);
  };

  const quickPickReference = () => {
    if (!selectedCount) return;
    setSelectionMode("quickpick");
    initializeGames("quickpick");
    setExpandedGame(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fffdf8] to-[#fff7e8] pb-28 text-[#111]">
      <CustomModal {...modal} onClose={closeModal} />

      {/* HERO — supplied image */}
      <section className="mx-auto max-w-[860px] px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="relative h-[270px] overflow-hidden rounded-[22px] border-2 border-amber-400 bg-amber-50 shadow-[0_8px_25px_rgba(168,113,0,0.12)] sm:h-[352px]">
          <img
            src="https://i.ibb.co/60g6N1Fp/banner1.png"
            alt="WinLuxury Powerball"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 left-4 flex min-w-[220px] items-center gap-3 rounded-2xl border border-amber-500 bg-black/90 px-3 py-2.5 text-white shadow-2xl sm:bottom-6 sm:left-7 sm:min-w-[240px] sm:px-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white sm:h-12 sm:w-12">
              {activeCountryObject ? (
                <img
                  src={activeCountryObject.flag}
                  alt={activeCountryObject.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl">🇮🇳</span>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Playing from
              </div>
              <div className="text-lg font-black sm:text-xl">
                {activeCountryObject?.name || activeCountryName || "INDIA"}
              </div>
            </div>
            <ChevronDown size={22} className="ml-auto" />
          </div>
        </div>
      </section>

      {!activeCountryName && (
        <div className="mx-auto mt-3 flex max-w-[860px] items-center gap-3 px-4">
          <div className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={22} />
            <div className="flex-1">
              <strong className="block">Country not set</strong>
              <span className="text-sm">
                Update your profile before playing.
              </span>
            </div>
            <button
              onClick={() => (window.location.href = "/profile")}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white"
            >
              Update
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[860px] px-3 sm:px-5">
        {/* STEP 1 */}
        <section className="mt-3 rounded-[21px] border border-[#f0e6d5] bg-white/95 p-4 shadow-[0_5px_18px_rgba(103,77,29,0.07)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 text-xl font-black text-white shadow-lg">
              1
            </div>
            <div>
              <h2 className="text-[21px] font-black leading-none sm:text-[23px]">
                SELECT TICKET TYPE
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose your preferred ticket
              </p>
            </div>
            <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-sm font-black text-red-600 sm:flex">
              <Flame size={16} fill="currentColor" /> Best Value
            </div>
          </div>
          <div className="grid gap-3 grid-cols-4 sm:gap-4">
            {ticketTypes.slice(0, 4).map((ticket, index) => {
              const isActive = activeTicket === ticket._id;
              const visual = ticketVisuals[index % ticketVisuals.length];
              const Icon = visual.icon;
              return (
                <button
                  key={ticket._id}
                  onClick={() => setActiveTicket(ticket._id)}
                  onMouseEnter={() => setHoveredTicket(ticket._id)}
                  onMouseLeave={() => setHoveredTicket(null)}
                  className={`relative flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[17px] border-2 bg-gradient-to-b from-white to-[#fffdf8] p-3 text-center transition ${isActive ? "border-amber-500 shadow-[0_6px_15px_rgba(229,163,18,0.18)]" : "border-[#f1d7a3] hover:-translate-y-0.5 hover:shadow-lg"}`}
                >
                  {isActive && (
                    <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-500 font-black text-white shadow">
                      ✓
                    </span>
                  )}
                  {hoveredTicket === ticket._id && (
                    <TicketInfoTooltip ticket={ticket} />
                  )}
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#fff8d2] to-[#f4cf75] text-amber-500 shadow">
                    {" "}
                    <Icon size={34} />{" "}
                  </span>
                  <strong className="text-sm font-black sm:text-[17px]">
                    {ticket.title || visual.title}
                  </strong>
                  <small className="text-xs text-amber-700 sm:text-sm">
                    {ticket.subTitle || visual.subtitle}
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 2 */}
        <section className="mt-2 rounded-[21px] border border-[#f0e6d5] bg-white/95 p-4 shadow-[0_5px_18px_rgba(103,77,29,0.07)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 text-xl font-black text-white shadow-lg">
              2
            </div>
            <div>
              <h2 className="text-[21px] font-black leading-none sm:text-[23px]">
                SELECT GAME TYPE
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose your game type
              </p>
            </div>
          </div>
          <div className="relative flex min-h-[105px] items-center overflow-hidden rounded-[18px] border-2 border-amber-500 bg-gradient-to-r from-[#fff6d8] via-[#fffdf6] to-[#fff0bc] p-3 shadow-[0_5px_14px_rgba(230,166,0,0.13)] sm:p-4">
            <div className="flex h-20 w-20 shrink-0 rotate-[-8deg] flex-col items-center justify-center rounded-full border-2 border-red-900 bg-gradient-to-br from-red-400 via-red-700 to-red-950 text-xs font-black text-white shadow-lg sm:h-[88px] sm:w-[88px]">
              <span>POWER</span>
              <span>BALL</span>
            </div>
            <div className="min-w-0 px-3 sm:px-6">
              <strong className="block text-xl font-black sm:text-[28px]">
                {selectedGameTypeTitle || "POWERBALL"}
              </strong>
              <span className="text-sm text-amber-700 sm:text-lg">
                Win Big. Dream Bigger.
              </span>
            </div>
            <div className="mx-2 hidden h-20 w-px bg-amber-300 sm:block" />
            <div className="hidden items-center gap-3 sm:flex">
              <Trophy size={38} className="text-amber-500" />
              <div>
                <small className="block text-xs font-bold text-amber-900">
                  JACKPOT
                </small>
                <strong className="block text-2xl font-black">
                  {/* {jackpotAmount} */}
                </strong>
                <span className="text-xs text-gray-600">Estimated Jackpot</span>
              </div>
            </div>
            <select
              value={selectedGameType || ""}
              onChange={(e) => selectGameType(e.target.value || null)}
              disabled={!activeTicket || availableGameTypes.length === 0}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              aria-label="Select game type"
            >
              <option value="">Select Game Type</option>
              {availableGameTypes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={24}
              className="ml-auto shrink-0 text-amber-600"
            />
          </div>
        </section>

        {/* STEP 3 */}
        <section className="mt-2 rounded-[21px] border border-[#f0e6d5] bg-white/95 p-4 shadow-[0_5px_18px_rgba(103,77,29,0.07)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 text-xl font-black text-white shadow-lg">
              3
            </div>
            <div>
              <h2 className="text-[21px] font-black leading-none sm:text-[23px]">
                SELECT GAME PACKAGE
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose your game package
              </p>
            </div>
            <div className="ml-auto hidden bg-gradient-to-r from-red-500 to-red-700 px-4 py-2 text-xs font-black text-white sm:block [clip-path:polygon(8%_0,100%_0,93%_100%,0_100%)]">
              BEST ODDS
            </div>
          </div>
          <div className="relative flex min-h-[76px] items-center overflow-hidden rounded-[18px] border-2 border-amber-500 bg-[#fffdf8] px-3 shadow-[0_5px_14px_rgba(230,166,0,0.1)]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#fff5c4] to-[#efbd38] text-amber-600 shadow">
              <Package size={34} />
            </div>
            <div className="ml-4">
              <strong className="block text-sm font-black sm:text-lg">
                POWER PACK ({selectedCount?.totalGames || 6} GAMES)
              </strong>
              <span className="text-xs text-amber-700 sm:text-sm">
                {selectedCount?.discount
                  ? `${selectedCount.discount}% Off · Best Odds`
                  : "Best Odds - Max Wins"}
              </span>
            </div>
            <span className="ml-auto mr-4 hidden font-black text-gray-700 sm:block">
              {selectedCount
                ? formatPrice(selectedCount.price, activeCountryCode)
                : "—"}
            </span>
            <select
              value={selectedGameCount || ""}
              onChange={(e) => selectPackage(e.target.value || null)}
              disabled={!selectedGameType || filteredGameCounts.length === 0}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              aria-label="Select game package"
            >
              <option value="">Select Game Package</option>
              {filteredGameCounts.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.totalGames} Games -{" "}
                  {getCurrencySymbol(activeCountryCode)}
                  {item.price}
                </option>
              ))}
            </select>
            <ChevronDown size={24} className="text-amber-600" />
          </div>
        </section>

        {/* STEP 4 */}
        {activeTicket && activeCountryName && (
          <section className="mt-2 rounded-[21px] border border-[#f0e6d5] bg-white/95 p-4 shadow-[0_5px_18px_rgba(103,77,29,0.07)] sm:p-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 text-xl font-black text-white shadow-lg">
                4
              </div>
              <div>
                <h2 className="text-[21px] font-black leading-none sm:text-[23px]">
                  SELECT NUMBERS
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Choose 5 numbers + 1 Powerball
                </p>
              </div>
              <button
                onClick={quickPickReference}
                disabled={!selectedCount}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#ffe28a] to-[#f4b82c] px-3 py-2 text-xs font-black text-amber-900 shadow sm:px-5 sm:text-sm"
              >
                <Zap size={17} fill="currentColor" /> QUICK PICK
              </button>
            </div>
            <div className="mb-2 flex justify-between px-2 text-xs font-black text-amber-700 sm:text-sm">
              <span>PICK 5 NUMBERS</span>
              <span className="mr-24 sm:mr-40">POWERBALL</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:gap-3">
              <div className="flex shrink-0 gap-2 sm:gap-3">
                {displayNumbers.slice(0, 5).map((num, index) => (
                  <button
                    key={`${num}-${index}`}
                    onClick={() =>
                      selectionMode === "pick" &&
                      referenceGame &&
                      toggleNumber(0, num)
                    }
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-amber-500 bg-white text-lg font-black shadow sm:h-[67px] sm:w-[67px] sm:text-[23px]"
                  >
                    {num}
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 text-[10px] text-white">
                      ✓
                    </span>
                  </button>
                ))}
              </div>
              <span className="text-xl font-black">+</span>
              <button
                onClick={quickPickReference}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-800 text-lg font-black text-white shadow sm:h-[69px] sm:w-[69px] sm:text-[22px]"
              >
                {String(displayPowerball).padStart(2, "0")}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 text-[10px]">
                  ✓
                </span>
              </button>
              <div className="ml-auto hidden min-h-[105px] w-[170px] shrink-0 grid-cols-2 items-center rounded-2xl bg-gradient-to-br from-[#090807] to-[#252015] px-3 py-2 text-white shadow-lg sm:grid">
                <div className="col-span-1 text-center">
                  <small className="text-[10px]">TOTAL GAMES</small>
                  <strong className="block text-2xl text-amber-400">
                    {selectedCount?.totalGames || 6}
                  </strong>
                  <i className="my-1 block h-px bg-amber-900" />
                  <small className="text-[10px]">POTENTIAL WINS</small>
                  <strong className="block text-2xl text-amber-400">X10</strong>
                </div>
                <div className="flex h-12 items-end gap-1">
                  {[14, 22, 29, 37, 46].map((h, i) => (
                    <b
                      key={i}
                      className="w-1.5 rounded-t bg-amber-400"
                      style={{ height: h }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {selectionMode === "pick" && referenceGame && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 font-black text-amber-900">
                  <ClipboardList size={18} /> Pick your numbers manually
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 sm:gap-2">
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(0, num)}
                      className={`h-9 rounded-full border text-xs font-bold ${referenceNumbers.includes(num) ? "border-amber-600 bg-amber-500 text-white" : "border-amber-100 bg-white text-gray-700 hover:border-amber-400"}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => togglePowerball(0, num)}
                      className={`h-9 rounded-full border text-xs font-bold ${referencePowerball === num ? "border-red-700 bg-red-600 text-white" : "border-red-100 bg-white text-red-600 hover:border-red-400"}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SUMMARY */}
        {selectedCount &&
          games.length > 0 &&
          allGamesFilled &&
          activeCountryName && (
            <section className="mt-2 rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-[#080807] to-[#211d15] p-4 text-white shadow-xl sm:p-5">
              <div className="flex gap-3">
                <ClipboardList className="shrink-0 text-amber-400" size={32} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black sm:text-lg">
                    YOUR SELECTION SUMMARY
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 border-b border-amber-900 pb-2">
                    <span className="text-xs font-bold text-amber-400">
                      Numbers
                    </span>
                    <span className="text-sm font-bold">
                      {displayNumbers.slice(0, 5).join("  ")}
                    </span>
                    <span>|</span>
                    <span className="text-sm font-bold">
                      Powerball: {String(displayPowerball).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Game Type", selectedGameTypeTitle || "POWERBALL"],
                      ["Package", `POWER PACK (${selectedCount.totalGames})`],
                      ["Total Games", selectedCount.totalGames],
                      // ["Estimated Jackpot", jackpotAmount],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <small className="block text-[10px] font-bold text-amber-400">
                          {label}
                        </small>
                        <strong className="block truncate text-xs sm:text-sm">
                          {value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* PLAY NOW — supplied button image */}
        {selectedCount &&
          allGamesFilled &&
          selectionMode !== null &&
          games.length > 0 &&
          activeCountryName && (
            <>
              <button
                onClick={handleAddToCart}
                disabled={entryLoading}
                className="group relative mt-3 block h-[86px] w-full overflow-hidden rounded-2xl border-2 border-amber-500 shadow-xl disabled:opacity-70"
              >
                <img
                  src="https://i.ibb.co/39SJT6f1/banner6.png"
                  alt="Play Now"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center gap-5 text-3xl font-black tracking-wide text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)] sm:text-4xl">
                  {entryLoading ? (
                    "PROCESSING…"
                  ) : (
                    <>
                      <span>»</span> PLAY NOW <span>«</span>
                    </>
                  )}
                </span>
                {!entryLoading && (
                  <small className="absolute bottom-1 left-0 right-0 text-xs font-bold text-white drop-shadow">
                    GOOD LUCK! MAY FORTUNE BE WITH YOU!
                  </small>
                )}
              </button>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[
                  [Calendar, "DRAW TIME", "Today", "10:30 PM"],
                  [BarChart3, "ODDS", "1 in 292M", "Win Probability"],
                  [ShieldCheck, "SECURE PLAY", "100% Safe", "Secure & Fair"],
                  [Trophy, "JACKPOT", "Est. Jackpot"],
                ].map(([Icon, label, value, sub]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-amber-100 bg-white p-3 shadow-sm"
                  >
                    <Icon size={21} className="mb-1 text-amber-500" />
                    <small className="block text-[9px] font-bold text-gray-500">
                      {label}
                    </small>
                    <strong className="block text-sm sm:text-base">
                      {value}
                    </strong>
                    <span className="text-[9px] text-gray-500">{sub}</span>
                  </div>
                ))}
              </div>
            </>
          )}
      </main>

      {/* FIXED BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex h-[78px] max-w-[860px] items-center justify-around rounded-t-[26px] border border-amber-100 bg-white/95 px-2 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] backdrop-blur">
        <button className="flex flex-col items-center gap-1 text-amber-600">
          <Home size={24} />
          <span className="text-xs font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <BarChart3 size={24} />
          <span className="text-xs font-bold">Activity</span>
        </button>
        <button className="-mt-9 flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-300 to-amber-500 text-black shadow-[0_5px_20px_rgba(218,151,0,0.4)]">
          <Gift size={24} />
          <span className="text-[9px] font-black">PROMO</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <WalletCards size={24} />
          <span className="text-xs font-bold">Wallet</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <UserCircle size={24} />
          <span className="text-xs font-bold">Account</span>
        </button>
      </nav>
    </div>
  );
};

export default GameSelection;
