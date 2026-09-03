import {
  ArrowLeft,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  BarChart3,
  Calendar,
  ChevronRight,
  Crown,
  Dice5,
  Gem,
  Grid3x3,
  History,
  Landmark,
  Moon,
  Sparkles,
  Sun,
  Trophy,
  User,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getActiveMarkets } from "../../redux/slices/marketSlice";

/* ============================================================
   IMAGE HELPERS
   ============================================================ */

// Default market image
const DEFAULT_MARKET_IMAGE =
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80";

// Game type images
const GAME_TYPE_IMAGES = {
  single:
    "https://i.ibb.co/JwYrJyVn/Chat-GPT-Image-Aug-29-2026-11-07-30-AM.png",
  "single-patti":
    "https://i.ibb.co/wZ9YJRPH/Chat-GPT-Image-Aug-29-2026-10-44-14-AM.png",
  "double-patti":
    "https://i.ibb.co/qSH5WsR/Chat-GPT-Image-Aug-29-2026-11-01-10-AM.png",
  "triple-patti":
    "https://i.ibb.co/fYGbwZdz/Chat-GPT-Image-Aug-29-2026-11-01-13-AM.png",
  jodi: "https://i.ibb.co/5X47nGm7/Chat-GPT-Image-Aug-26-2026-04-52-31-PM.png",
  panna: "https://i.ibb.co/dwZ2Zy6v/Chat-GPT-Image-Aug-26-2026-04-54-23-PM.png",
  spot: "https://images.unsplash.com/photo-1518544889287-6d7a6d3f0f4a?auto=format&fit=crop&w=500&q=80",
  "half-sangam":
    "https://i.ibb.co/bqtmp8C/Chat-GPT-Image-Aug-29-2026-10-31-53-AM.png",
  "full-sangam":
    "https://i.ibb.co/6cwhRTJC/Chat-GPT-Image-Aug-29-2026-10-34-25-AM.png",
  "last-digit":
    "https://i.ibb.co/N2YkKkT9/Chat-GPT-Image-Aug-29-2026-10-40-13-AM.png",
  "first-digit":
    "https://i.ibb.co/RTZS9SPp/Chat-GPT-Image-Aug-29-2026-10-40-06-AM.png",
};

/* ============================================================
   MOCK DATA HELPERS
   ============================================================ */

const MOCK_AVATARS = [Crown, Landmark, Gem, Sparkles];

const seededDigit = (seed) => {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash % 10;
};

const mockTriplet = (marketId, salt = "") =>
  [0, 1, 2].map((i) => seededDigit(`${marketId}-${salt}-${i}`));

const toMinutes = (t) => {
  if (!t) return 0;

  const [h, m] = t.split(":").map(Number);

  return h * 60 + (m || 0);
};

const formatTime12 = (t) => {
  if (!t) return "--:--";

  const [h, m] = t.split(":").map(Number);

  const period = h >= 12 ? "PM" : "AM";

  let hour12 = h % 12;

  if (hour12 === 0) {
    hour12 = 12;
  }

  return `${String(hour12).padStart(
    2,
    "0",
  )}:${String(m).padStart(2, "0")} ${period}`;
};

/* ============================================================
   MARKET STATUS
   ============================================================ */

const getMarketStatus = (openTime, closeTime) => {
  const now = new Date();

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const openMin = toMinutes(openTime);
  const closeMin = toMinutes(closeTime);

  if (closeMin < openMin) {
    if (nowMin >= openMin || nowMin <= closeMin) {
      return "live";
    }

    return "upcoming";
  }

  if (nowMin < openMin) {
    return "upcoming";
  }

  if (nowMin <= closeMin) {
    return "live";
  }

  return "closed";
};

/* ============================================================
   STATUS STYLES
   ============================================================ */

const STATUS_STYLES = {
  live: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    label: "LIVE",
  },

  upcoming: {
    dot: "bg-amber-300",
    text: "text-amber-600",
    bg: "bg-amber-50/60 border-amber-100",
    label: "UPCOMING",
  },

  closed: {
    dot: "bg-gray-300",
    text: "text-gray-400",
    bg: "bg-gray-50 border-gray-100",
    label: "CLOSED",
  },
};

/* ============================================================
   GAME TYPES
   ============================================================ */

const GAME_TYPES = [
  {
    key: "single",
    label: "SINGLE",
    sub: "Choose One Number",
    mode: "digits",
    digits: ["7"],
    image: GAME_TYPE_IMAGES.single,
    icon: Dice5,
  },

  {
    key: "single-patti",
    label: "SINGLE PATTI",
    sub: "Choose Single Patti",
    mode: "icon",
    image: GAME_TYPE_IMAGES["single-patti"],
    icon: Dice5,
  },

  {
    key: "double-patti",
    label: "DOUBLE PATTI",
    sub: "Choose Double Patti",
    mode: "icon",
    image: GAME_TYPE_IMAGES["double-patti"],
    icon: Dice5,
  },

  {
    key: "triple-patti",
    label: "TRIPLE PATTI",
    sub: "Choose Triple Patti",
    mode: "icon",
    image: GAME_TYPE_IMAGES["triple-patti"],
    icon: Dice5,
  },

  {
    key: "jodi",
    label: "JODI",
    sub: "Choose Two Numbers",
    mode: "digits",
    digits: ["7", "8"],
    image: GAME_TYPE_IMAGES.jodi,
    icon: Grid3x3,
  },

  {
    key: "panna",
    label: "PANNA",
    sub: "Choose Panna",
    mode: "icon",
    image: GAME_TYPE_IMAGES.panna,
    icon: Dice5,
  },

  {
    key: "spot",
    label: "SPOT",
    sub: "Choose Spot Number",
    mode: "digits",
    digits: ["5"],
    image: GAME_TYPE_IMAGES.spot,
    icon: Gem,
  },

  {
    key: "half-sangam",
    label: "HALF-SANGAM",
    sub: "HALF-SANGAM",
    mode: "icon",
    image: GAME_TYPE_IMAGES["half-sangam"],
    icon: Moon,
  },

  {
    key: "full-sangam",
    label: "FULL-SANGAM",
    sub: "Full SANGAM",
    mode: "icon",
    image: GAME_TYPE_IMAGES["full-sangam"],
    icon: Sun,
  },

  {
    key: "last-digit",
    label: "LAST DIGIT",
    sub: "Choose Last Digit",
    mode: "icon",
    image: GAME_TYPE_IMAGES["last-digit"],
    icon: ArrowRightFromLine,
  },

  {
    key: "first-digit",
    label: "FIRST DIGIT",
    sub: "Choose First Digit",
    mode: "icon",
    image: GAME_TYPE_IMAGES["first-digit"],
    icon: ArrowLeftFromLine,
  },
];

// ✅ FIXED: Removed "open" and "close" from allowed game types
const getAllowedGameTypes = (market) => {
  if (!market) return [];
  if (market.digitType === "2-digit") {
    return GAME_TYPES.filter((game) =>
      ["jodi", "last-digit", "first-digit"].includes(game.key),
    );
  }
  if (market.digitType === "3-digit") {
    return GAME_TYPES.filter((game) =>
      [
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
      ].includes(game.key),
    );
  }
  return [];
};

const DEFAULT_VISIBLE_GAME_TYPES = 6;

/* ============================================================
   SAFE IMAGE
   ============================================================ */
const SafeImage = ({
  src,
  alt,
  className = "",
  fallbackIcon: FallbackIcon = Gem,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-amber-300 to-yellow-500 ${className}`}
      >
        <FallbackIcon className="text-white" size={28} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setImageError(true)}
      className={className}
    />
  );
};

/* ============================================================
   COMPONENT
   ============================================================ */

const MatkaMarkets = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMarkets, loading } = useSelector((state) => state.market);
  const { user } = useSelector((state) => state.auth);

  const walletBalance = user?.balance;

  const [activeTab, setActiveTab] = useState("live");
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [justOpened, setJustOpened] = useState(false);
  const [showAllGameTypes, setShowAllGameTypes] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState(null);

  const detailRef = useRef(null);
  const openedTimeoutRef = useRef(null);

  /* ============================================================
     FETCH MARKETS
     ============================================================ */

  useEffect(() => {
    dispatch(getActiveMarkets());
  }, [dispatch]);

  /* ============================================================
     DEFAULT MARKET
     ============================================================ */

  useEffect(() => {
    if (activeMarkets?.length && !selectedMarketId) {
      setSelectedMarketId(activeMarkets[0]._id);
    }
  }, [activeMarkets, selectedMarketId]);

  /* ============================================================
     CLEANUP
     ============================================================ */

  useEffect(() => {
    return () => clearTimeout(openedTimeoutRef.current);
  }, []);

  /* ============================================================
     MARKET STATUS
     ============================================================ */

  const marketsWithStatus = useMemo(
    () =>
      (activeMarkets || []).map((m) => ({
        ...m,
        status: getMarketStatus(m.openTime, m.closeTime),
      })),
    [activeMarkets],
  );

  /* ============================================================
     FILTERED MARKETS
     ============================================================ */

  const filteredMarkets = useMemo(() => {
    if (activeTab === "live") {
      return marketsWithStatus.filter((m) => m.status === "live");
    }

    if (activeTab === "upcoming") {
      return marketsWithStatus.filter((m) => m.status === "upcoming");
    }

    return marketsWithStatus.filter((m) => m.status !== "closed");
  }, [marketsWithStatus, activeTab]);

  /* ============================================================
     SELECTED MARKET - THIS WAS MISSING!
     ============================================================ */

  const selectedMarket = marketsWithStatus.find(
    (m) => m._id === selectedMarketId,
  );

  /* ============================================================
     OPEN MARKET
     ============================================================ */

  const openMarket = (marketId) => {
    setSelectedMarketId(marketId);

    setJustOpened(true);

    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    clearTimeout(openedTimeoutRef.current);

    openedTimeoutRef.current = setTimeout(() => setJustOpened(false), 1200);
  };

  /* ============================================================
     PLACE BID
     ============================================================ */

  const handlePlaceBid = (marketId, gameType) => {
    const normalizedGameType = String(gameType || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

    navigate(`/matka/place-bid/${marketId}`, {
      state: {
        gameType: normalizedGameType,
        marketId,
      },
    });
  };

  /* ============================================================
     SELECT GAME TYPE
     ============================================================ */

  const handleSelectGameType = (gameType) => {
    if (!selectedMarket) return;

    const allowedGameTypes = getAllowedGameTypes(selectedMarket);
    if (!allowedGameTypes.some((game) => game.key === gameType)) return;

    setSelectedGameType(gameType);
    setShowAllGameTypes(false);
    handlePlaceBid(selectedMarket._id, gameType);
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="relative text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-amber-500" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading markets...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div className="scrollbar-hide relative h-screen overflow-y-auto bg-white pb-10">
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:px-6">
        {/* ======================================================
           HEADER
        ====================================================== */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 text-amber-600 shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-amber-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
              Choose Market
            </h2>
          </div>
        </div>
        {/* ======================================================
           CHOOSE MARKET
        ====================================================== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex overflow-hidden rounded-full border border-amber-100 bg-amber-50/40 p-1 text-xs font-bold">
              {["live", "open", "upcoming"].map((tab) => {
                const style = STATUS_STYLES[tab === "open" ? "live" : tab];
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                      isActive
                        ? "border border-amber-300 bg-white text-amber-700 shadow"
                        : "text-gray-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {tab.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MARKET CARDS */}
          {filteredMarkets.length > 0 ? (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
              {filteredMarkets.map((market, idx) => {
                const Avatar = MOCK_AVATARS[idx % MOCK_AVATARS.length];
                const style = STATUS_STYLES[market.status];
                const isSelected = market._id === selectedMarketId;

                const marketImage =
                  market.image ||
                  market.imageUrl ||
                  market.logo ||
                  DEFAULT_MARKET_IMAGE;

                return (
                  <div
                    key={market._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openMarket(market._id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && openMarket(market._id)
                    }
                    className={`relative w-[7rem] flex-shrink-0 cursor-pointer rounded-2xl border bg-white p-2 text-center shadow-sm transition ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "border-gray-100"
                    }`}
                  >
                    {/* STATUS BADGE */}
                    <span
                      className={`absolute right-3 top-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${style.bg} ${style.text}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                      />
                      {style.label}
                    </span>

                    {/* CIRCULAR AVATAR */}
                    <div className="mx-auto mt-2 h-16 w-16 overflow-hidden rounded-full ring-2 ring-amber-100">
                      <SafeImage
                        src={marketImage}
                        alt={market.name || "Market"}
                        fallbackIcon={Avatar}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-center text-sm font-extrabold text-amber-800">
                        {market.name}
                      </p>

                      <p className="mt-2 text-center text-[11px] text-gray-500">
                        Open{" "}
                        <span className="font-semibold text-gray-700">
                          {formatTime12(market.openTime)}
                        </span>
                      </p>

                      <p className="text-center text-[11px] text-gray-500">
                        Close{" "}
                        <span className="font-semibold text-gray-700">
                          {formatTime12(market.closeTime)}
                        </span>
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMarket(market._id);
                        }}
                        className={`mt-3 w-full rounded-lg py-1.5 text-center text-xs font-bold text-black shadow ${
                          market.status === "live"
                            ? "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
                            : "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
                        }`}
                      >
                        {market.status === "live" ? "PLAY →" : "VIEW →"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMarket(market._id);
                        }}
                        className="mt-1 w-full text-center text-[11px] font-semibold text-amber-700"
                      >
                        RESULTS →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 py-10 text-center text-sm text-gray-400">
              No markets in this tab right now
            </div>
          )}
        </div>
        {/* ======================================================
          SELECTED MARKET DETAIL
        ====================================================== */}

        {selectedMarket && (
          <div
            ref={detailRef}
            className={`relative overflow-hidden rounded-2xl scroll-mt-4 transition-all duration-300 sm:rounded-3xl ${
              justOpened ? "ring-4 ring-amber-300" : ""
            }`}
          >
            <div className="relative w-full aspect-[16/9]">
              <img
                src="https://i.ibb.co/Y7sP4Bvk/Chat-GPT-Image-Aug-29-2026-11-42-31-AM.png"
                alt="Matka"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />

              {/* Market Opened toast - unchanged */}
              <div
                className={`pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white shadow transition-opacity duration-500 ${
                  justOpened ? "opacity-100" : "opacity-0"
                }`}
              >
                {selectedMarket.name} opened
              </div>

              {/* Market Name — top-right ribbon box */}
              <div className="absolute left-[42%] top-[21%] flex h-[16%] w-[54%] items-center justify-center px-2">
                <h3 className="truncate text-center text-sm font-extrabold text-amber-900 sm:text-2xl">
                  {selectedMarket.name}
                </h3>
              </div>

              {/* Wallet Balance box */}
              <div className="absolute left-[70%] top-[51%] flex h-[10%] w-[30%] items-center justify-center px-1">
                <span className="text-[10px] font-bold text-gray-800 sm:text-base">
                  ₹
                  {walletBalance?.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  }) || "0.00"}
                </span>
              </div>

              {/* Bottom row: 4 boxes */}
              <div className="absolute bottom-[12%] left-[12px] flex w-full justify-between px-[2%]">
                {/* Box 1: Status */}
                <div className="flex w-[23%] items-center justify-center">
                  <span className="truncate text-[13px] font-bold text-amber-900 sm:text-xs">
                    {selectedMarket.status === "live" ? "OPEN" : "CLOSED"}
                  </span>
                </div>

                {/* Box 2: Timing (open=green dot, close=red dot) */}
                <div className="flex w-[23%] flex-col items-center justify-center gap-0.5 ml-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-bold text-gray-700 sm:text-[10px]">
                      {formatTime12(selectedMarket.openTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] font-bold text-gray-700 sm:text-[10px]">
                      {formatTime12(selectedMarket.closeTime)}
                    </span>
                  </div>
                </div>

                {/* Box 3: Today's Result balls */}
                <div className="flex w-[23%] items-center justify-center gap-1">
                  {mockTriplet(
                    selectedMarket.marketId || selectedMarket._id,
                    "today",
                  ).map((d, i) => (
                    <span
                      key={i}
                      className="text-sm font-extrabold text-red-700 sm:text-base"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Box 4: Last result date */}
                <div className="flex w-[23%] items-center justify-center">
                  <span className="text-[12px] font-bold text-amber-900 sm:text-[10px]">
                    {new Date(Date.now() - 86400000)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })
                      .toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ======================================================
           GAME TYPES
        ====================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3x3 size={16} className="text-amber-600" />

              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                Choose Game Type
              </h2>
            </div>

            {getAllowedGameTypes(selectedMarket).length >
              DEFAULT_VISIBLE_GAME_TYPES && (
              <button
                onClick={() => setShowAllGameTypes((prev) => !prev)}
                className="flex items-center gap-0.5 text-xs font-bold text-amber-700"
              >
                {showAllGameTypes ? "SHOW LESS" : "VIEW ALL"}
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200 ${
                    showAllGameTypes ? "rotate-90" : ""
                  }`}
                />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 sm:gap-3">
            {getAllowedGameTypes(selectedMarket)
              .slice(
                0,
                showAllGameTypes
                  ? getAllowedGameTypes(selectedMarket).length
                  : DEFAULT_VISIBLE_GAME_TYPES,
              )
              .map((gt) => {
                const Icon = gt.icon;

                const isSelected = selectedGameType === gt.key;

                return (
                  <div
                    key={gt.key}
                    className={`overflow-hidden rounded-2xl border bg-white text-center shadow-sm transition ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "border-amber-100"
                    }`}
                  >
                    {/* GAME IMAGE */}

                    <div className="relative h-24 w-full overflow-hidden sm:h-32">
                      <SafeImage
                        src={gt.image}
                        alt={gt.label}
                        fallbackIcon={Icon}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-2 sm:p-3">
                      <p className="mb-2 min-h-[16px] text-[8px] text-gray-400 sm:text-[10px]">
                        {gt.sub}
                      </p>

                      <button
                        onClick={() =>
                          selectedMarket && handleSelectGameType(gt.key)
                        }
                        className="w-full rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] py-1.5 text-[10px] font-bold text-black transition-all hover:shadow-md sm:py-2 sm:text-xs"
                        disabled={!selectedMarket}
                      >
                        {selectedMarket ? "PLAY →" : "SELECT MARKET"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        {/* ======================================================
           QUICK ACCESS
        ====================================================== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />

            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
              Quick Access
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Today's Result",
                icon: Trophy,
              },
              {
                label: "Previous Results",
                icon: History,
              },
              {
                label: "Detailed Chart",
                icon: BarChart3,
              },
              {
                label: "My Plays",
                icon: User,
              },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center justify-center gap-1 rounded-xl border border-amber-100 bg-white py-2 text-[9px] font-medium text-gray-700 shadow-sm"
              >
                <item.icon size={10} className="text-amber-500" />

                {item.label}
              </button>
            ))}
          </div>
        </div>
        {/* ======================================================
           RECENT RESULTS
        ====================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />

              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                Recent Results
              </h2>
            </div>

            <button className="flex items-center gap-0.5 text-xs font-bold text-amber-700">
              VIEW ALL
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {filteredMarkets.map((market) => (
              <div
                key={market._id}
                className="w-36 flex-shrink-0 overflow-hidden rounded-xl border border-amber-100 bg-white text-center shadow-sm"
              >
                <div className="p-2">
                  <p className="text-[9px] font-semibold text-gray-400">
                    {new Date()
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })
                      .toUpperCase()}
                  </p>

                  <p className="mb-2 truncate text-[11px] font-extrabold text-amber-800">
                    {market.name?.toUpperCase()}
                  </p>

                  <div className="flex justify-center gap-1">
                    {mockTriplet(market.marketId || market._id, "recent").map(
                      (d, i) => (
                        <span
                          key={i}
                          className="flex h-6 w-6 items-center justify-center rounded bg-amber-50 text-xs font-bold text-amber-800"
                        >
                          {d}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatkaMarkets;
