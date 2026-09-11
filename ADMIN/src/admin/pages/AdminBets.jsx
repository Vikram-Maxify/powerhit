import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAdminBets,
  setBetFilters,
  clearBetFilters,
} from "../redux/adminBetReducer";

const AdminBets = () => {
  const dispatch = useDispatch();

  const {
    bets,
    loading,
    error,
    pagination,
    stats,
    filters,
  } = useSelector((state) => state.adminBet);

  const [searchMobile, setSearchMobile] = useState(
    filters.mobile || ""
  );

  const [searchPeriod, setSearchPeriod] = useState(
    filters.period || ""
  );

  // =====================================================
  // LOAD DATA
  // =====================================================
  useEffect(() => {
    dispatch(
      getAdminBets({
        page: 1,
        ...filters,
      })
    );
  }, [
    dispatch,
    filters.game,
    filters.status,
    filters.bet,
  ]);

  // =====================================================
  // REFRESH
  // =====================================================
  const refreshData = () => {
    dispatch(
      getAdminBets({
        page: pagination.page,
        ...filters,
      })
    );
  };

  // =====================================================
  // SEARCH
  // =====================================================
  const handleSearch = () => {
    dispatch(
      setBetFilters({
        mobile: searchMobile,
        period: searchPeriod,
      })
    );

    dispatch(
      getAdminBets({
        page: 1,
        ...filters,
        mobile: searchMobile,
        period: searchPeriod,
      })
    );
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================
  const handleClear = () => {
    setSearchMobile("");
    setSearchPeriod("");

    dispatch(clearBetFilters());

    dispatch(
      getAdminBets({
        page: 1,
        game: "all",
        status: "all",
        bet: "all",
        mobile: "",
        period: "",
      })
    );
  };

  // =====================================================
  // FILTER
  // =====================================================
  const handleFilterChange = (key, value) => {
    dispatch(
      setBetFilters({
        [key]: value,
      })
    );
  };

  // =====================================================
  // PAGINATION
  // =====================================================
  const goToPage = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      loading
    ) {
      return;
    }

    dispatch(
      getAdminBets({
        page,
        ...filters,
      })
    );
  };

  // =====================================================
  // BET TYPE
  // =====================================================
  const getBetType = (bet) => {
    const map = {
      l: "Big",
      n: "Small",
      d: "Red",
      x: "Green",
      t: "Violet",

      "0": "Number 0",
      "1": "Number 1",
      "2": "Number 2",
      "3": "Number 3",
      "4": "Number 4",
      "5": "Number 5",
      "6": "Number 6",
      "7": "Number 7",
      "8": "Number 8",
      "9": "Number 9",
    };

    return map[bet] || bet;
  };

  // =====================================================
  // GAME NAME
  // =====================================================
  const getGameName = (game) => {
    const map = {
      wingo: "Wingo 1M",
      wingo3: "Wingo 3M",
      wingo5: "Wingo 5M",
      wingo10: "Wingo 10M",
      trx: "TRX",
      trx3: "TRX 3M",
      trx5: "TRX 5M",
      trx10: "TRX 10M",
    };

    return map[game] || game;
  };

  // =====================================================
  // STATUS
  // =====================================================
  const getStatus = (status) => {
    if (status === 1) {
      return {
        text: "Won",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    if (status === 2) {
      return {
        text: "Lost",
        className:
          "bg-red-50 text-red-700 border-red-200",
      };
    }

    return {
      text: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  };

  // =====================================================
  // NUMBER RESULT
  // =====================================================
  const formatResult = (result) => {
    if (
      result === null ||
      result === undefined
    ) {
      return "-";
    }

    return result;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Admin Bets
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View all users bets, numbers, timers and results
            </p>
          </div>

          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h5M20 20v-5h-5M5.5 9A7.5 7.5 0 0118 6.5L20 9M18.5 15A7.5 7.5 0 016 17.5L4 15"
              />
            </svg>

            Refresh
          </button>
        </div>

        {/* =================================================
            STATS
        ================================================= */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">

          {/* Total */}
          <StatCard
            title="Total Bets"
            value={stats.totalBets}
            icon="📊"
          />

          {/* Amount */}
          <StatCard
            title="Bet Amount"
            value={`₹${Number(
              stats.totalBetAmount || 0
            ).toFixed(2)}`}
            icon="💰"
          />

          {/* Fee */}
          <StatCard
            title="Total Fee"
            value={`₹${Number(
              stats.totalFee || 0
            ).toFixed(2)}`}
            icon="💳"
          />

          {/* Pending */}
          <StatCard
            title="Pending"
            value={stats.pendingBets}
            icon="⏳"
          />

          {/* Won */}
          <StatCard
            title="Won"
            value={stats.wonBets}
            icon="✅"
          />

          {/* Lost */}
          <StatCard
            title="Lost"
            value={stats.lostBets}
            icon="❌"
          />
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">

            {/* Game */}
            <select
              value={filters.game}
              onChange={(e) =>
                handleFilterChange(
                  "game",
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">
                All Games
              </option>

              <option value="wingo">
                Wingo 1M
              </option>

              <option value="wingo3">
                Wingo 3M
              </option>

              <option value="wingo5">
                Wingo 5M
              </option>

              <option value="wingo10">
                Wingo 10M
              </option>

              <option value="trx">
                TRX
              </option>

              <option value="trx3">
                TRX 3M
              </option>

              <option value="trx5">
                TRX 5M
              </option>

              <option value="trx10">
                TRX 10M
              </option>
            </select>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) =>
                handleFilterChange(
                  "status",
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">
                All Status
              </option>

              <option value="0">
                Pending
              </option>

              <option value="1">
                Won
              </option>

              <option value="2">
                Lost
              </option>
            </select>

            {/* Bet */}
            <select
              value={filters.bet}
              onChange={(e) =>
                handleFilterChange(
                  "bet",
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">
                All Bets
              </option>

              <option value="l">
                Big
              </option>

              <option value="n">
                Small
              </option>

              <option value="d">
                Red
              </option>

              <option value="x">
                Green
              </option>

              <option value="t">
                Violet
              </option>

              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                (number) => (
                  <option
                    key={number}
                    value={number}
                  >
                    Number {number}
                  </option>
                )
              )}
            </select>

            {/* Mobile */}
            <input
              type="text"
              value={searchMobile}
              onChange={(e) =>
                setSearchMobile(e.target.value)
              }
              placeholder="Search mobile..."
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />

            {/* Period */}
            <input
              type="text"
              value={searchPeriod}
              onChange={(e) =>
                setSearchPeriod(e.target.value)
              }
              placeholder="Search period..."
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Search
              </button>

              <button
                onClick={handleClear}
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            TABLE
        ================================================= */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">
                Bet History
              </h2>

              <p className="text-xs text-slate-500">
                Total {pagination.total} bets
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading bets...
                </p>
              </div>
            </div>
          ) : bets.length === 0 ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="text-5xl">
                  📭
                </div>

                <h3 className="mt-3 font-semibold text-slate-700">
                  No Bets Found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  No bets match your current filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1500px] text-left">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                      User
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                      Game
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                      Timer / Period
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                      Bet
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                      Result
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Win Amount
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Net
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {bets.map((item, index) => {
                    const status = getStatus(
                      item.status
                    );

                    const net = Number(
                      item.netResult || 0
                    );

                    return (
                      <tr
                        key={
                          item._id ||
                          item.id_product ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >

                        {/* INDEX */}
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {(pagination.page - 1) *
                            pagination.limit +
                            index +
                            1}
                        </td>

                        {/* USER */}
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.mobile || "-"}
                            </p>

                            <p className="text-xs text-slate-400">
                              Code:{" "}
                              {item.code || "-"}
                            </p>
                          </div>
                        </td>

                        {/* GAME */}
                        <td className="px-4 py-4">
                          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {getGameName(
                              item.game
                            )}
                          </span>
                        </td>

                        {/* PERIOD */}
                        <td className="px-4 py-4">
                          <p className="font-mono text-xs font-semibold text-slate-700">
                            {item.period || "-"}
                          </p>
                        </td>

                        {/* BET */}
                        <td className="px-4 py-4">
                          <div>
                            <span className="font-semibold text-slate-800">
                              {getBetType(
                                item.bet
                              )}
                            </span>

                            <p className="mt-1 text-xs text-slate-400">
                              Code: {item.bet}
                            </p>
                          </div>
                        </td>

                        {/* AMOUNT */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-slate-800">
                            ₹
                            {Number(
                              item.money || 0
                            ).toFixed(2)}
                          </p>

                          {Number(
                            item.fee || 0
                          ) > 0 && (
                            <p className="text-xs text-slate-400">
                              Fee ₹
                              {Number(
                                item.fee
                              ).toFixed(2)}
                            </p>
                          )}
                        </td>

                        {/* RESULT */}
                        <td className="px-4 py-4 text-center">
                          {item.result !== null &&
                          item.result !== undefined ? (
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800">
                              {formatResult(
                                item.result
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              -
                            </span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.text}
                          </span>
                        </td>

                        {/* WIN */}
                        <td className="px-4 py-4 text-right">
                          {Number(
                            item.winningAmount || 0
                          ) > 0 ? (
                            <span className="font-semibold text-emerald-600">
                              ₹
                              {Number(
                                item.winningAmount
                              ).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              ₹0.00
                            </span>
                          )}
                        </td>

                        {/* NET */}
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`font-bold ${
                              net > 0
                                ? "text-emerald-600"
                                : net < 0
                                ? "text-red-600"
                                : "text-slate-400"
                            }`}
                          >
                            {net > 0
                              ? "+"
                              : ""}
                            ₹{net.toFixed(2)}
                          </span>
                        </td>

                        {/* TIME */}
                        <td className="px-4 py-4">
                          <p className="text-xs text-slate-600">
                            {item.createdAt
                              ? new Date(
                                  item.createdAt
                                ).toLocaleString(
                                  "en-IN"
                                )
                              : item.today ||
                                "-"}
                          </p>

                          {item.isdemo && (
                            <span className="mt-1 inline-block rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                              DEMO
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">
                Page{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex items-center gap-1">

                <button
                  onClick={() =>
                    goToPage(
                      pagination.page - 1
                    )
                  }
                  disabled={
                    pagination.page <= 1 ||
                    loading
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  {
                    length: Math.min(
                      pagination.totalPages,
                      5
                    ),
                  },
                  (_, index) => {
                    let page;

                    if (
                      pagination.totalPages <=
                      5
                    ) {
                      page = index + 1;
                    } else if (
                      pagination.page <= 3
                    ) {
                      page = index + 1;
                    } else if (
                      pagination.page >=
                      pagination.totalPages - 2
                    ) {
                      page =
                        pagination.totalPages -
                        4 +
                        index;
                    } else {
                      page =
                        pagination.page -
                        2 +
                        index;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() =>
                          goToPage(page)
                        }
                        disabled={loading}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          pagination.page ===
                          page
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() =>
                    goToPage(
                      pagination.page + 1
                    )
                  }
                  disabled={
                    pagination.page >=
                      pagination.totalPages ||
                    loading
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// STAT CARD
// =====================================================
const StatCard = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-xl font-bold text-slate-800">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminBets;
