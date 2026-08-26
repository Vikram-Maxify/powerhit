import {
  Award,
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearLowestBid,
  getBidsByMarketId,
  getLowestBidNumber,
} from "../redux/adminBidSlice";
import { getAdminMarkets } from "../redux/adminMarketSlice";

import {
  clearError,
  clearMessage,
  declareResult,
  getAdminResults,
  getAdminResultStats,
} from "../redux/adminResultSlice";

const AdminResults = () => {
  const dispatch = useDispatch();

  // =========================
  // RESULT STATE
  // =========================
  const resultState = useSelector((state) => state.adminResult) || {};

  const {
    results = [],
    stats = [],
    loading = false,
    error = null,
    message = null,
    success = false,
    pagination = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0,
    },
  } = resultState;

  // =========================
  // MARKET STATE
  // =========================
  const marketState = useSelector((state) => state.adminMarket) || {};

  const { markets = [] } = marketState;

  // =========================
  // BID STATE
  // =========================
  const bidState = useSelector((state) => state.adminBid) || {};

  const {
    lowestBid = null,
    lowestBidLoading = false,
    lowestBidError = null,
    marketBids = [],
    marketBidsLoading = false,
    marketBidsError = null,
  } = bidState;

  // =========================
  // MODAL
  // =========================
  const [showModal, setShowModal] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);

  // =========================
  // FILTER
  // =========================
  const [filter, setFilter] = useState({
    marketId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });

  // =========================
  // FORM DATA
  // =========================
  const [formData, setFormData] = useState({
    marketId: "",
    winningResult: "",
    resultDate: new Date().toISOString().split("T")[0],
    nextOpenDate: "",
  });

  // =========================
  // GAME TYPES
  // =========================
  const gameTypes = [
    {
      key: "jodi",
      label: "Jodi",
    },
    {
      key: "panna",
      label: "Panna",
    },
    {
      key: "half-sangam",
      label: "Half-Sangam",
    },
    {
      key: "full-sangam",
      label: "Full-Sangam",
    },
    {
      key: "last-digit",
      label: "Last Digit",
    },
    {
      key: "first-digit",
      label: "First Digit",
    },
  ];

  // Admin only selects the market digit type:
  // 2-digit or 3-digit.
  const getMarketDigitType = (market) => {
    return market?.digitType === "2-digit" ||
      market?.digitType === "3-digit"
      ? market.digitType
      : "";
  };

  const getAllowedGamesForMarket = (market) => {
    const digitType = getMarketDigitType(market);

    if (digitType === "2-digit") {
      return gameTypes.filter((game) =>
        ["jodi", "last-digit", "first-digit"].includes(
          game.key
        )
      );
    }

    if (digitType === "3-digit") {
      return gameTypes;
    }

    return [];
  };

  // =========================
  // INITIAL DATA
  // =========================
  useEffect(() => {
    dispatch(getAdminResults(filter));
    dispatch(getAdminResultStats());
    dispatch(getAdminMarkets({ limit: 100 }));
  }, [dispatch, filter]);

  // =========================
  // CLEAR MESSAGES
  // =========================
  useEffect(() => {
    let errorTimer;
    let messageTimer;

    if (error) {
      errorTimer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
    }

    if (message) {
      messageTimer = setTimeout(() => {
        dispatch(clearMessage());
      }, 3000);
    }

    return () => {
      if (errorTimer) clearTimeout(errorTimer);
      if (messageTimer) clearTimeout(messageTimer);
    };
  }, [error, message, dispatch]);

  // =========================
  // FILTER CHANGE
  // =========================
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilter((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  // =========================
  // WINNING RESULT CHANGE
  // =========================
  const handleWinningResultChange = (value) => {
    const selectedMarket = markets.find(
      (m) => String(m._id) === String(formData.marketId)
    );

    const digitType = getMarketDigitType(selectedMarket);
    // Winning result is digits-only.
    // 2-digit market: 2 digits (e.g. 25)
    // 3-digit market: 6 digits (e.g. 123456)
    // For 3-digit markets:
    //   123 = Open Panna
    //   456 = Close Panna
    //   123456 = Full result
    const maxLength =
      digitType === "2-digit" ? 2 : digitType === "3-digit" ? 6 : 0;

    const cleaned = String(value || "")
      .replace(/\D/g, "")
      .slice(0, maxLength);

    setFormData((prev) => ({
      ...prev,
      winningResult: cleaned,
    }));
  };

  // =========================
  // FORM INPUT CHANGE
  // =========================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Fetch lowest bids whenever market changes
    if (name === "marketId") {
      dispatch(clearLowestBid());

      if (value) {
        dispatch(getLowestBidNumber(value));
      }
    }
  };

  // =========================
  // SUBMIT RESULT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.marketId) {
      alert("Please select a market");
      return;
    }

    const selectedMarket = markets.find(
      (m) => String(m._id) === String(formData.marketId)
    );

    const digitType =
      getMarketDigitType(selectedMarket);

    if (!digitType) {
      alert(
        "Please configure this market as 2-digit or 3-digit"
      );
      return;
    }

    const expectedLength =
      digitType === "2-digit" ? 2 : digitType === "3-digit" ? 6 : 0;

    const winningResult =
      String(formData.winningResult || "").trim();

    if (!winningResult) {
      alert("Please enter the winning result");
      return;
    }


    if (winningResult.length !== expectedLength) {
      alert(
        `Please enter exactly ${expectedLength} digits for this ${digitType} market`
      );
      return;
    }

    if (!formData.nextOpenDate) {
      alert("Please select next open date");
      return;
    }

    if (
      formData.resultDate &&
      formData.nextOpenDate < formData.resultDate
    ) {
      alert(
        "Next open date must be after or equal to result date"
      );
      return;
    }

    // ------------------------------------------------------------
    // BUILD ONLY VALID GAME-TYPE KEYS.
    // Never send "result" as a game type.
    //
    // 2-digit result: 25
    //   jodi=25, first-digit=2, last-digit=5
    //
    // 3-digit market result: 123456
    //   openPanna=123
    //   closePanna=456
    //
    //   jodi=56
    //   panna=123
    //   half-sangam=123-6
    //   full-sangam=123-456
    //   first-digit=1
    //   last-digit=6
    // ------------------------------------------------------------

    const payload = {
      marketId: formData.marketId,
      winningNumbers:
        digitType === "2-digit"
          ? {
              jodi: winningResult,
              "first-digit": winningResult.charAt(0),
              "last-digit": winningResult.slice(-1),
            }
          : {
              jodi: winningResult.slice(-2),
              panna: winningResult.slice(0, 3),
              "half-sangam": `${winningResult.slice(0, 3)}-${winningResult.slice(-1)}`,
              "full-sangam": `${winningResult.slice(0, 3)}-${winningResult.slice(3, 6)}`,
              "first-digit": winningResult.charAt(0),
              "last-digit": winningResult.slice(-1),
            },
      digitType,
      resultDate: formData.resultDate,
      nextOpenDate: formData.nextOpenDate,
    };

    try {
      const response =
        await dispatch(
          declareResult(payload)
        );

      if (
        declareResult.fulfilled.match(
          response
        )
      ) {
        await dispatch(
          getAdminResults(filter)
        );

        await dispatch(
          getAdminResultStats()
        );

        setShowModal(false);

        dispatch(clearLowestBid());

        setFormData({
          marketId: "",
          winningResult: "",
          resultDate:
            new Date()
              .toISOString()
              .split("T")[0],
          nextOpenDate: "",
        });
      }
    } catch (error) {
      console.error(
        "Declare Result Error:",
        error
      );
    }
  };

  // =========================
  // CLEAR FILTERS
  // =========================
  const clearFilters = () => {
    setFilter({
      marketId: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 20,
    });
  };

  // =========================
  // CLOSE MODAL
  // =========================
  const closeModal = () => {
    setShowModal(false);
    dispatch(clearLowestBid());

    setFormData({
      marketId: "",
      winningResult: "",
      resultDate:
        new Date().toISOString().split("T")[0],
      nextOpenDate: "",
    });
  };

  // =========================
  // CURRENCY
  // =========================
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // =========================
  // GAME TYPE DISPLAY
  // =========================
  const getGameTypeDisplay = (type) => {
    const display = {
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };

    return display[type] || type || "N/A";
  };

  // =========================
  // RENDER WINNING NUMBERS
  // =========================
  const renderWinningNumbers = (result) => {
    try {
      if (!result) {
        return <span className="text-gray-400 text-xs">N/A</span>;
      }

      if (!result.winningNumber) {
        return <span className="text-gray-400 text-xs">N/A</span>;
      }

      const wn = result.winningNumber;

      // String
      if (typeof wn === "string") {
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            {wn}
          </span>
        );
      }

      // Array
      if (Array.isArray(wn)) {
        return wn.map((num, index) => (
          <span
            key={index}
            className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 mr-1 mb-1 inline-block"
          >
            {num}
          </span>
        ));
      }

      // Object
      if (typeof wn === "object" && wn !== null) {
        const entries = Object.entries(wn).filter(
          ([, value]) =>
            value !== null &&
            value !== undefined &&
            value !== "" &&
            value !== "null" &&
            value !== "undefined",
        );

        if (entries.length === 0) {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }

        return entries.map(([gameType, number]) => {
          const displayName = getGameTypeDisplay(gameType);

          return (
            <span
              key={gameType}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 mr-1 mb-1 inline-block"
            >
              {displayName}: {number}
            </span>
          );
        });
      }

      return <span className="text-gray-400 text-xs">N/A</span>;
    } catch (error) {
      console.error("Error rendering winning numbers:", error);

      return <span className="text-gray-400 text-xs">Error</span>;
    }
  };

  // =========================
  // STATS
  // =========================
  const calculateStats = () => {
    if (!results || results.length === 0) {
      return {
        totalResults: 0,
        totalPayout: 0,
        totalWinningBids: 0,
        avgPayout: 0,
      };
    }

    const totalResults = results.length;

    const totalPayout = results.reduce(
      (sum, r) => sum + (r.totalPayout || 0),
      0,
    );

    const totalWinningBids = results.reduce(
      (sum, r) => sum + (r.totalWinningBids || 0),
      0,
    );

    const avgPayout = totalResults > 0 ? totalPayout / totalResults : 0;

    return {
      totalResults,
      totalPayout,
      totalWinningBids,
      avgPayout,
    };
  };

  // =========================
  // MARKET NAME
  // =========================
  const getMarketName = (marketId) => {
    if (!marketId) {
      return "N/A";
    }

    // Populated market object
    if (typeof marketId === "object") {
      return (
        marketId.name ||
        marketId.marketName ||
        marketId.marketId ||
        marketId._id?.toString?.() ||
        "N/A"
      );
    }

    const marketIdString = String(marketId);

    const market = markets.find((m) => m && String(m._id) === marketIdString);

    return market?.name || market?.marketName || marketIdString || "N/A";
  };

  // =========================
  // GET ALL BIDS FOR MARKET
  // =========================
  const handleMarketClick = async (result) => {
    const marketId =
      typeof result?.marketId === "object"
        ? result?.marketId?._id
        : result?.marketId;

    if (!marketId) {
      alert("Market ID not found");
      return;
    }

    setSelectedMarket({
      id: String(marketId),
      name: getMarketName(result.marketId),
    });

    setShowBidsModal(true);

    await dispatch(getBidsByMarketId(marketId));
  };

  // =========================
  // GET LOWEST BID DATA
  // =========================
  const getLowestBidData = (gameKey) => {
    if (!lowestBid) {
      return null;
    }

    // Backend response:
    // {
    //   success: true,
    //   lowestBids: {
    //      single: {...},
    //      jodi: {...}
    //   }
    // }

    if (lowestBid.lowestBids) {
      return lowestBid.lowestBids?.[gameKey] || null;
    }

    // If reducer stores action.payload.lowestBids directly
    if (typeof lowestBid === "object" && lowestBid[gameKey]) {
      return lowestBid[gameKey];
    }

    return null;
  };

  const statsData = calculateStats();

  // =========================
  // LOADING SCREEN
  // =========================
  if (loading && results.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6 p-4">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy size={28} className="text-amber-500" />
            Results
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {pagination?.total || results.length || 0} total results found
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            dispatch(clearLowestBid());
          }}
          className="px-5 py-2.5 bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Declare Result
        </button>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Trophy size={18} className="text-blue-600" />
            </div>

            <div>
              <p className="text-gray-500 text-xs">Total Results</p>

              <p className="text-xl font-bold text-gray-800">
                {statsData.totalResults}
              </p>
            </div>
          </div>
        </div>

        {/* Total Payout */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>

            <div>
              <p className="text-gray-500 text-xs">Total Payout</p>

              <p className="text-xl font-bold text-green-600">
                {formatCurrency(statsData.totalPayout)}
              </p>
            </div>
          </div>
        </div>

        {/* Winners */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Award size={18} className="text-purple-600" />
            </div>

            <div>
              <p className="text-gray-500 text-xs">Total Winners</p>

              <p className="text-xl font-bold text-purple-600">
                {statsData.totalWinningBids}
              </p>
            </div>
          </div>
        </div>

        {/* Average */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign size={18} className="text-orange-600" />
            </div>

            <div>
              <p className="text-gray-500 text-xs">Avg Payout</p>

              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(statsData.avgPayout)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {success && message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✅ {message}
        </div>
      )}

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Market */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Market
            </label>

            <select
              name="marketId"
              value={filter.marketId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">All Markets</option>

              {markets?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m?.name || m?.marketName || "Unnamed Market"}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Start Date
            </label>

            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              End Date
            </label>

            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={clearFilters}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
            >
              Clear
            </button>

            <button
              onClick={() => dispatch(getAdminResults(filter))}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= RESULTS TABLE ================= */}
      {results?.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Market Name
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Winning Numbers
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Bids
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Winners
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Payout
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {results.map((result) => (
                  <tr
                    key={
                      result._id || `${result.marketId}-${result.resultDate}`
                    }
                    className="hover:bg-amber-50/30 transition"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleMarketClick(result)}
                        className="text-sm font-semibold text-amber-600 hover:text-amber-800 hover:underline cursor-pointer transition"
                        title="View all bids for this market"
                      >
                        {getMarketName(result.marketId)}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {renderWinningNumbers(result)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.totalBids || 0}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.totalWinningBids || 0}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {formatCurrency(result.totalPayout || 0)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {result.resultDate
                        ? new Date(result.resultDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">
              Showing {results.length} of {pagination?.total || results.length}{" "}
              results
            </span>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    page: Math.max(1, (prev.page || 1) - 1),
                  }))
                }
                disabled={filter.page === 1 || !pagination?.pages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Previous
              </button>

              <span className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-amber-50 text-amber-700 font-medium">
                {filter.page || 1} of {pagination?.pages || 1}
              </span>

              <button
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    page: Math.min(
                      pagination?.pages || 1,
                      (prev.page || 1) + 1,
                    ),
                  }))
                }
                disabled={
                  filter.page === (pagination?.pages || 1) || !pagination?.pages
                }
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>

          <p className="text-gray-500 text-lg">No results found</p>

          <p className="text-gray-400 text-sm mt-1">
            Declare a result to get started
          </p>
        </div>
      )}

      {/* ================= MARKET BIDS MODAL ================= */}
      {showBidsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowBidsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  Market Bids
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedMarket?.name || "Market"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBidsModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[75vh]">
              {marketBidsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
                </div>
              ) : marketBidsError ? (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                  {marketBidsError}
                </div>
              ) : marketBids.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-gray-600 font-medium">No bids found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    This market has no bids.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Game Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Bid Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Possible Win
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {marketBids.map((bid, index) => {
                        const user =
                          typeof bid.userId === "object" ? bid.userId : null;

                        const statusClass = {
                          pending: "bg-yellow-100 text-yellow-700",
                          won: "bg-green-100 text-green-700",
                          lost: "bg-red-100 text-red-700",
                          cancelled: "bg-gray-100 text-gray-600",
                        };

                        return (
                          <tr
                            key={bid._id || `${bid.number}-${index}`}
                            className="hover:bg-amber-50/30 transition"
                          >
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {user?.username ||
                                    user?.name ||
                                    "Unknown User"}
                                </p>

                                {user?.mobile && (
                                  <p className="text-xs text-gray-400">
                                    {user.mobile}
                                  </p>
                                )}

                                {user?.email && (
                                  <p className="text-xs text-gray-400">
                                    {user.email}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                                {getGameTypeDisplay(bid.gameType)}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-gray-800">
                                {bid.number || "-"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                              {formatCurrency(bid.bidAmount)}
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-green-600">
                              {formatCurrency(bid.possibleWinAmount)}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  statusClass[bid.status] ||
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {bid.status || "pending"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs text-gray-500">
                              {bid.createdAt
                                ? new Date(bid.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Total Bids:{" "}
                <strong className="text-gray-800">{marketBids.length}</strong>
              </span>

              <button
                type="button"
                onClick={() => setShowBidsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DECLARE RESULT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                Declare Result
              </h2>

              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* ================= MARKET ================= */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Market *
                  </label>

                  <select
                    name="marketId"
                    value={formData.marketId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Market</option>

                    {markets
                      ?.filter((m) => m?.isActive && !m?.isResultDeclared)
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m?.name || m?.marketName || "Unnamed Market"}
                        </option>
                      ))}
                  </select>

                  <p className="text-xs text-gray-400 mt-1">
                    Showing only active markets with pending results
                  </p>

                  {/* ================= LOWEST BIDS ================= */}
                  {formData.marketId && (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-semibold text-gray-700">
                          Lowest Bid Numbers
                        </span>

                        {lowestBidLoading && (
                          <span className="text-xs text-amber-600">
                            Loading...
                          </span>
                        )}

                        {lowestBidError && (
                          <span className="text-xs text-red-500">
                            {String(lowestBidError)}
                          </span>
                        )}
                      </div>

                      {!lowestBidLoading && !lowestBidError && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {getAllowedGamesForMarket(markets.find((m) => String(m._id) === String(formData.marketId))).map((game) => {
                            const bidData = getLowestBidData(game.key);

                            return (
                              <div
                                key={game.key}
                                className="bg-white border border-amber-100 rounded-lg p-2"
                              >
                                <p className="text-[10px] text-gray-500 font-medium">
                                  {game.label}
                                </p>

                                <p className="text-lg font-bold text-amber-700">
                                  {bidData?.number ?? "N/A"}
                                </p>

                                {bidData?.bidAmount > 0 && (
                                  <p className="text-[10px] text-gray-400">
                                    Bid: ₹{bidData.bidAmount}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!lowestBidLoading && !lowestBidError && !lowestBid && (
                        <p className="text-xs text-gray-400">
                          No lowest bid data available
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ================= WINNING RESULT ================= */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Winning Result *
                  </label>

                  {(() => {
                    const selectedMarket =
                      markets.find(
                        (m) =>
                          String(m._id) ===
                          String(formData.marketId)
                      );

                    const digitType =
                      getMarketDigitType(
                        selectedMarket
                      );

                    const expectedLength =
                      digitType === "2-digit"
                        ? 2
                        : digitType === "3-digit"
                          ? 6
                          : 0;

                    return (
                      <>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={
                            expectedLength || 6
                          }
                          value={
                            formData.winningResult ||
                            ""
                          }
                          onChange={(e) =>
                            handleWinningResultChange(
                              e.target.value
                            )
                          }
                          placeholder={
                            digitType === "2-digit"
                              ? "Enter 2 digit result e.g. 25"
                              : digitType === "3-digit"
                                ? "Enter 6 digit result e.g. 123456"
                                : "Select market first"
                          }
                          disabled={!digitType}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-semibold tracking-widest disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />

                        {digitType === "2-digit" && (
                          <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                            <p className="font-semibold mb-1">
                              2-Digit Result
                            </p>
                            <p>
                              Example: <strong>25</strong>
                              {" → "}
                              Jodi 25, First Digit 2,
                              Last Digit 5
                            </p>
                          </div>
                        )}

                        {digitType === "3-digit" && (
                          <div className="mt-3 rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-700">
                            <p className="font-semibold mb-1">
                              3-Digit Result
                            </p>
                            <p>
                              Example: <strong>123456</strong>
                              {" → "}
                              Open Panna 123, Close Panna 456
                            </p>
                            <p className="mt-1">
                              Jodi 56, Panna 123, Half-Sangam 123-6,
                              Full-Sangam 123-456, First Digit 1,
                              Last Digit 6
                            </p>
                          </div>
                        )}

                        {digitType && (
                          <p className="text-xs text-gray-400 mt-2">
                            Enter only the main result.
                            All applicable game results
                            are calculated automatically.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* ================= RESULT DATE ================= */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result Date *
                  </label>

                  <input
                    type="date"
                    name="resultDate"
                    value={formData.resultDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* ================= NEXT OPEN DATE ================= */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Open Date *
                  </label>

                  <input
                    type="date"
                    name="nextOpenDate"
                    value={formData.nextOpenDate}
                    min={formData.resultDate || undefined}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Select the next date when this market will open.
                  </p>
                </div>
              </div>

              {/* ================= BUTTONS ================= */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Declaring..." : "Declare Result"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResults;
