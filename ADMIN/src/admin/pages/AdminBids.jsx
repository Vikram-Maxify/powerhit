import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAllBids,
  getBidStats,
  clearError,
  clearMessage,
} from "../redux/adminBidSlice";

import { getAdminMarkets } from "../redux/adminMarketSlice";

import {
  Search,
  Clock,
  Trophy,
  XCircle,
  AlertCircle,
  RefreshCw,
  Target,
  DollarSign,
  TrendingUp,
} from "lucide-react";

const AdminBids = () => {
  const dispatch = useDispatch();

  // =========================================================
  // REDUX
  // =========================================================

  const bidState = useSelector((state) => state.adminBid || {});
  const marketState = useSelector((state) => state.adminMarket || {});

  const {
    stats = null,
    loading = false,
    error = null,
    message = null,
    pagination = {},
  } = bidState;

  const markets = Array.isArray(marketState.markets)
    ? marketState.markets
    : [];

  // =========================================================
  // IMPORTANT:
  // API RESPONSE:
  //
  // {
  //   success: true,
  //   data: {
  //      bids: [...]
  //   }
  // }
  //
  // Redux implementations can store it in different ways.
  // Handle all common structures.
  // =========================================================

  const bids = useMemo(() => {
    if (Array.isArray(bidState.bids)) {
      return bidState.bids;
    }

    if (Array.isArray(bidState.bids?.bids)) {
      return bidState.bids.bids;
    }

    if (Array.isArray(bidState.bids?.data?.bids)) {
      return bidState.bids.data.bids;
    }

    if (Array.isArray(bidState.data?.bids)) {
      return bidState.data.bids;
    }

    if (Array.isArray(bidState.data?.data?.bids)) {
      return bidState.data.data.bids;
    }

    return [];
  }, [bidState]);

  // =========================================================
  // FILTER
  // =========================================================

  const [filter, setFilter] = useState({
    status: "",
    marketId: "",
    userId: "",
    gameType: "",
    page: 1,
    limit: 1000,
  });

  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    const request = {
      status: "",
      marketId: "",
      userId: "",
      gameType: "",
      page: 1,
      limit: 1000,
    };

    // Initial load ALWAYS gets all bids.
    dispatch(getAllBids(request));
    dispatch(getBidStats());
    dispatch(getAdminMarkets({ limit: 1000 }));
  }, [dispatch]);

  // =========================================================
  // LOAD FILTERED DATA
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        getAllBids({
          status: filter.status || "",
          marketId: filter.marketId || "",
          userId: filter.userId || "",
          gameType: filter.gameType || "",
          page: filter.page || 1,
          limit: 1000,
        })
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [
    dispatch,
    filter.status,
    filter.marketId,
    filter.userId,
    filter.gameType,
    filter.page,
  ]);

  // =========================================================
  // CLEAR ERROR
  // =========================================================

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      dispatch(clearError());
    }, 5000);

    return () => clearTimeout(timer);
  }, [error, dispatch]);

  // =========================================================
  // CLEAR MESSAGE
  // =========================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      dispatch(clearMessage());
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, dispatch]);

  // =========================================================
  // FILTER CHANGE
  // =========================================================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilter((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearchTerm("");

    setFilter({
      status: "",
      marketId: "",
      userId: "",
      gameType: "",
      page: 1,
      limit: 1000,
    });

    dispatch(
      getAllBids({
        status: "",
        marketId: "",
        userId: "",
        gameType: "",
        page: 1,
        limit: 1000,
      })
    );
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const refreshData = () => {
    dispatch(
      getAllBids({
        status: filter.status || "",
        marketId: filter.marketId || "",
        userId: filter.userId || "",
        gameType: filter.gameType || "",
        page: 1,
        limit: 1000,
      })
    );

    dispatch(getBidStats());
    dispatch(getAdminMarkets({ limit: 1000 }));
  };

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Pending",
      },

      won: {
        color: "bg-green-100 text-green-800",
        icon: Trophy,
        label: "Won 🎉",
      },

      lost: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Lost",
      },

      cancelled: {
        color: "bg-gray-100 text-gray-600",
        icon: AlertCircle,
        label: "Cancelled",
      },
    };

    return configs[status] || configs.pending;
  };

  // =========================================================
  // GAME TYPE
  // =========================================================

  const getGameTypeDisplay = (type) => {
    const display = {
      single: "Single",
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };

    return display[type] || type || "N/A";
  };

  // =========================================================
  // GAME COLOR
  // =========================================================

  const getGameTypeColor = (type) => {
    const colors = {
      single: "bg-blue-100 text-blue-700",
      jodi: "bg-green-100 text-green-700",
      panna: "bg-purple-100 text-purple-700",
      "half-sangam": "bg-orange-100 text-orange-700",
      "full-sangam": "bg-red-100 text-red-700",
      "last-digit": "bg-indigo-100 text-indigo-700",
      "first-digit": "bg-pink-100 text-pink-700",
    };

    return colors[type] || "bg-gray-100 text-gray-700";
  };

  // =========================================================
  // CURRENCY
  // =========================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // FILTER SEARCH
  // =========================================================

  const displayedBids = useMemo(() => {
    if (!searchTerm.trim()) {
      return bids;
    }

    const search = searchTerm.toLowerCase().trim();

    return bids.filter((bid) => {
      const searchableValues = [
        bid._id,
        bid.transactionId,
        bid.number,
        bid.resultNumber,
        bid.status,
        bid.gameType,

        bid.userId?.name,
        bid.userId?.email,
        bid.userId?.mobile,

        bid.marketId?.name,
        bid.marketId?.marketId,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [bids, searchTerm]);

  // =========================================================
  // TOTAL
  // =========================================================

  const totalBids =
    Number(pagination?.total) > 0
      ? Number(pagination.total)
      : bids.length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && bids.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto" />

          <p className="text-gray-500 mt-4 text-sm">
            Loading all bids...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Target size={28} className="text-amber-500" />

            All Bids
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {totalBids} total bids found
          </p>
        </div>

        <button
          type="button"
          onClick={refreshData}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center gap-2"
        >
          <RefreshCw
            size={18}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* TOTAL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target size={18} className="text-blue-600" />
              </div>

              <div>
                <p className="text-gray-500 text-xs">
                  Total Bids
                </p>

                <p className="text-xl font-bold text-gray-800">
                  {stats.totalBids || totalBids || 0}
                </p>
              </div>

            </div>

          </div>

          {/* TODAY */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-green-600" />
              </div>

              <div>
                <p className="text-gray-500 text-xs">
                  Today's Bids
                </p>

                <p className="text-xl font-bold text-green-600">
                  {stats.todayBids || 0}
                </p>
              </div>

            </div>

          </div>

          {/* PENDING */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <DollarSign size={18} className="text-yellow-600" />
              </div>

              <div>
                <p className="text-gray-500 text-xs">
                  Pending Amount
                </p>

                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(
                    stats.statusStats?.find(
                      (item) => item._id === "pending"
                    )?.totalAmount || 0
                  )}
                </p>
              </div>

            </div>

          </div>

          {/* WON */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Trophy size={18} className="text-purple-600" />
              </div>

              <div>
                <p className="text-gray-500 text-xs">
                  Total Won
                </p>

                <p className="text-xl font-bold text-purple-600">
                  {stats.statusStats?.find(
                    (item) => item._id === "won"
                  )?.count || 0}
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✅ {message}
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">

          {/* SEARCH */}
          <div>

            <label className="block text-xs font-medium text-gray-500 mb-1">
              Search Bid
            </label>

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Number / user / transaction"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />

            </div>

          </div>

          {/* STATUS */}
          <div>

            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>

            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="won">
                Won
              </option>

              <option value="lost">
                Lost
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

          </div>

          {/* MARKET */}
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
              <option value="">
                All Markets
              </option>

              {markets.map((market) => (
                <option
                  key={market._id}
                  value={market._id}
                >
                  {market.name}
                </option>
              ))}
            </select>

          </div>

          {/* GAME */}
          <div>

            <label className="block text-xs font-medium text-gray-500 mb-1">
              Game Type
            </label>

            <select
              name="gameType"
              value={filter.gameType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">
                All Types
              </option>

              <option value="single">
                Single
              </option>

              <option value="jodi">
                Jodi
              </option>

              <option value="panna">
                Panna
              </option>

              <option value="half-sangam">
                Half-Sangam
              </option>

              <option value="full-sangam">
                Full-Sangam
              </option>

              <option value="last-digit">
                Last Digit
              </option>

              <option value="first-digit">
                First Digit
              </option>
            </select>

          </div>

          {/* CLEAR */}
          <div className="flex items-end">

            <button
              type="button"
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
            >
              Clear Filters
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      {displayedBids.length > 0 ? (

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">

            <div>

              <h2 className="font-semibold text-gray-800">
                All Bid Records
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Showing {displayedBids.length} bids
              </p>

            </div>

            {loading && (
              <RefreshCw
                size={18}
                className="animate-spin text-amber-500"
              />
            )}

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1600px]">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transaction
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Market
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Game
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Bid Number
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Result
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Bid Amount
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Possible Win
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Win Amount
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Next Open
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {displayedBids.map((bid, index) => {

                  const statusConfig =
                    getStatusConfig(bid.status);

                  const StatusIcon =
                    statusConfig.icon;

                  return (
                    <tr
                      key={bid._id || index}
                      className="hover:bg-amber-50/40 transition"
                    >

                      {/* # */}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* TRANSACTION */}
                      <td className="px-4 py-3">

                        <span
                          title={bid.transactionId || ""}
                          className="font-mono text-xs text-gray-600"
                        >
                          {bid.transactionId
                            ? bid.transactionId.length > 18
                              ? `${bid.transactionId.slice(
                                  0,
                                  18
                                )}...`
                              : bid.transactionId
                            : "-"}
                        </span>

                      </td>

                      {/* USER */}
                      <td className="px-4 py-3">

                        <div className="font-medium text-sm text-gray-800">
                          {bid.userId?.name || "N/A"}
                        </div>

                        <div className="text-xs text-gray-400">
                          {bid.userId?.mobile || ""}
                        </div>

                      </td>

                      {/* MARKET */}
                      <td className="px-4 py-3">

                        <div className="font-medium text-sm text-gray-800">
                          {bid.marketId?.name || "N/A"}
                        </div>

                        <div className="text-xs text-gray-400">
                          {bid.marketId?.marketId || ""}
                        </div>

                      </td>

                      {/* GAME */}
                      <td className="px-4 py-3">

                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getGameTypeColor(
                            bid.gameType
                          )}`}
                        >
                          {getGameTypeDisplay(
                            bid.gameType
                          )}
                        </span>

                      </td>

                      {/* BID NUMBER */}
                      <td className="px-4 py-3 text-center">

                        <span className="inline-flex min-w-[50px] justify-center px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-bold">
                          {bid.number ?? "-"}
                        </span>

                      </td>

                      {/* RESULT */}
                      <td className="px-4 py-3 text-center">

                        {bid.resultNumber !== null &&
                        bid.resultNumber !== undefined &&
                        bid.resultNumber !== "" ? (

                          <span className="inline-flex min-w-[50px] justify-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                            {bid.resultNumber}
                          </span>

                        ) : (

                          <span className="text-gray-400">
                            -
                          </span>

                        )}

                      </td>

                      {/* BID AMOUNT */}
                      <td className="px-4 py-3 text-right">

                        <span className="font-semibold text-gray-700">
                          {formatCurrency(
                            bid.bidAmount
                          )}
                        </span>

                      </td>

                      {/* POSSIBLE WIN */}
                      <td className="px-4 py-3 text-right">

                        <span className="font-medium text-blue-600">
                          {formatCurrency(
                            bid.possibleWinAmount
                          )}
                        </span>

                      </td>

                      {/* WIN AMOUNT */}
                      <td className="px-4 py-3 text-right">

                        {Number(bid.winAmount) > 0 ? (

                          <span className="font-bold text-green-600">
                            +
                            {formatCurrency(
                              bid.winAmount
                            )}
                          </span>

                        ) : (

                          <span className="text-gray-400">
                            ₹0
                          </span>

                        )}

                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}
                        >
                          <StatusIcon size={12} />

                          {statusConfig.label}
                        </span>

                      </td>

                      {/* CREATED */}
                      <td className="px-4 py-3">

                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(
                            bid.createdAt
                          )}
                        </span>

                      </td>

                      {/* NEXT OPEN */}
                      <td className="px-4 py-3">

                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(
                            bid.nextOpenDate
                          )}
                        </span>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

          {/* FOOTER */}
          <div className="px-4 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">

            <span className="text-sm text-gray-600">
              Showing{" "}
              <strong>
                {displayedBids.length}
              </strong>{" "}
              of{" "}
              <strong>
                {totalBids}
              </strong>{" "}
              bids
            </span>

            <div className="text-sm text-gray-500">
              All available bids loaded
            </div>

          </div>

        </div>

      ) : (

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">

          <div className="text-5xl mb-4">
            📭
          </div>

          <p className="text-gray-500 text-lg">
            No bids found
          </p>

          <p className="text-gray-400 text-sm mt-1">
            No bids match the selected filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
          >
            Show All Bids
          </button>

        </div>

      )}

    </div>
  );
};

export default AdminBids;