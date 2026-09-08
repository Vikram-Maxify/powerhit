import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllBet,
  getBetList,
  getPendingBetList,
  getUserBet,
  clearBetError,
} from "../redux/betAdminReducer";

const BetAdmin = () => {
  const dispatch = useDispatch();

  const {
    allBet = [],
    betList = [],
    pendingBetList = [],
    userBet = [],
    allBetLength = 0,
    betListLength = 0,
    pendingBetLength = 0,
    userBetLength = 0,
    totalMoney = 0,
    totalMoneyDown = 0,
    totalMoneyUp = 0,
    loading = false,
    error = null,
  } = useSelector((state) => state.betAdmin || {});

  const [tab, setTab] = useState("all");
  const [userId, setUserId] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const [status, setStatus] = useState("");
  const [betType, setBetType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, [tab, page, status, betType]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearBetError()), 4000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const params = useMemo(
    () => ({
      pageno: page,
      pageto: page + pageSize - 1,
      ...(status !== "" ? { status } : {}),
      ...(betType ? { bet: betType } : {}),
    }),
    [page, pageSize, status, betType]
  );

  const loadData = () => {
    if (tab === "all") {
      dispatch(getAllBet(params));
    } else if (tab === "completed") {
      dispatch(getBetList(params));
    } else if (tab === "pending") {
      dispatch(getPendingBetList(params));
    }
  };

  const searchUser = (e) => {
    e.preventDefault();
    if (!searchUserId.trim()) return;

    setUserId(searchUserId.trim());
    setPage(1);
    dispatch(
      getUserBet({
        userId: searchUserId.trim(),
        pageno: 1,
        pageto: pageSize,
      })
    );
    setTab("user");
  };

  const changeTab = (value) => {
    setTab(value);
    setPage(1);
    setStatus("");
    setBetType("");
  };

  const refresh = () => {
    if (tab === "user" && userId) {
      dispatch(
        getUserBet({
          userId,
          pageno: page,
          pageto: page + pageSize - 1,
        })
      );
      return;
    }
    loadData();
  };

  const rows =
    tab === "all"
      ? allBet
      : tab === "completed"
      ? betList
      : tab === "pending"
      ? pendingBetList
      : userBet;

  const total =
    tab === "all"
      ? allBetLength
      : tab === "completed"
      ? betListLength
      : tab === "pending"
      ? pendingBetLength
      : userBetLength;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getStatus = (value) => {
    const n = Number(value);
    if (n === 0) return { text: "Pending", className: "pending" };
    if (n === 1) return { text: "Win", className: "win" };
    if (n === 2) return { text: "Loss", className: "loss" };
    return { text: formatValue(value), className: "" };
  };

  return (
    <>
      <style>{`
        .bet-admin-page {
          width: 100%;
          min-height: 100vh;
          padding: 22px;
          background: #f6f7fb;
          box-sizing: border-box;
          color: #17191c;
          font-family: Inter, Arial, sans-serif;
        }

        .bet-admin-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .bet-admin-title h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .bet-admin-title p {
          margin: 5px 0 0;
          color: #777;
          font-size: 13px;
        }

        .bet-refresh {
          border: 0;
          border-radius: 8px;
          padding: 10px 16px;
          cursor: pointer;
          background: #111827;
          color: #fff;
          font-weight: 600;
        }

        .bet-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .bet-card {
          background: #fff;
          border: 1px solid #e8e8ec;
          border-radius: 12px;
          padding: 17px;
          box-shadow: 0 2px 8px rgba(0,0,0,.03);
        }

        .bet-card span {
          display: block;
          color: #777;
          font-size: 12px;
          margin-bottom: 7px;
        }

        .bet-card strong {
          font-size: 23px;
        }

        .bet-tabs {
          display: flex;
          gap: 8px;
          background: #fff;
          padding: 8px;
          border: 1px solid #e8e8ec;
          border-radius: 10px;
          margin-bottom: 14px;
          overflow-x: auto;
        }

        .bet-tab {
          border: 0;
          background: transparent;
          padding: 9px 15px;
          border-radius: 7px;
          cursor: pointer;
          white-space: nowrap;
          font-weight: 600;
          color: #666;
        }

        .bet-tab.active {
          background: #111827;
          color: #fff;
        }

        .bet-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          align-items: center;
          background: #fff;
          padding: 13px;
          border: 1px solid #e8e8ec;
          border-radius: 10px;
          margin-bottom: 14px;
        }

        .bet-input, .bet-select {
          height: 38px;
          border: 1px solid #dddfe5;
          border-radius: 7px;
          padding: 0 11px;
          outline: none;
          background: #fff;
          min-width: 150px;
        }

        .bet-search {
          display: flex;
          gap: 7px;
        }

        .bet-btn {
          height: 38px;
          border: 0;
          border-radius: 7px;
          padding: 0 14px;
          background: #111827;
          color: #fff;
          cursor: pointer;
          font-weight: 600;
        }

        .bet-table-wrap {
          background: #fff;
          border: 1px solid #e8e8ec;
          border-radius: 10px;
          overflow: auto;
        }

        .bet-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .bet-table th {
          background: #f8f8fa;
          text-align: left;
          font-size: 12px;
          color: #666;
          padding: 13px 12px;
          border-bottom: 1px solid #e8e8ec;
          white-space: nowrap;
        }

        .bet-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f2;
          font-size: 13px;
          white-space: nowrap;
        }

        .bet-table tr:last-child td {
          border-bottom: 0;
        }

        .status {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .status.pending { background: #fff3cd; color: #856404; }
        .status.win { background: #e8f7ee; color: #187a43; }
        .status.loss { background: #fdeaea; color: #c53030; }

        .direction-up { color: #17834b; font-weight: 700; }
        .direction-down { color: #c0392b; font-weight: 700; }

        .empty {
          text-align: center;
          padding: 45px 20px;
          color: #888;
        }

        .loader {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error {
          margin-bottom: 12px;
          padding: 11px 13px;
          border-radius: 8px;
          background: #fff0f0;
          color: #c53030;
          border: 1px solid #ffd5d5;
          font-size: 13px;
        }

        .bet-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 0;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-btn {
          min-width: 36px;
          height: 34px;
          border: 1px solid #dddfe5;
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
        }

        .page-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .bet-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .bet-admin-page {
            padding: 12px;
          }
          .bet-cards {
            grid-template-columns: 1fr 1fr;
          }
          .bet-admin-head {
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="bet-admin-page">
        <div className="bet-admin-head">
          <div className="bet-admin-title">
            <h2>Bet Management</h2>
            <p>View all, pending, completed and user-wise bets</p>
          </div>
          <button className="bet-refresh" onClick={refresh}>
            Refresh
          </button>
        </div>

        <div className="bet-cards">
          <div className="bet-card">
            <span>Total Bets</span>
            <strong>{allBetLength}</strong>
          </div>
          <div className="bet-card">
            <span>Pending Bets</span>
            <strong>{pendingBetLength}</strong>
          </div>
          <div className="bet-card">
            <span>Pending UP</span>
            <strong>{totalMoneyUp}</strong>
          </div>
          <div className="bet-card">
            <span>Pending DOWN</span>
            <strong>{totalMoneyDown}</strong>
          </div>
        </div>

        <div className="bet-tabs">
          <button
            className={`bet-tab ${tab === "all" ? "active" : ""}`}
            onClick={() => changeTab("all")}
          >
            All Bets
          </button>
          <button
            className={`bet-tab ${tab === "pending" ? "active" : ""}`}
            onClick={() => changeTab("pending")}
          >
            Pending
          </button>
          <button
            className={`bet-tab ${tab === "completed" ? "active" : ""}`}
            onClick={() => changeTab("completed")}
          >
            Completed
          </button>
          <button
            className={`bet-tab ${tab === "user" ? "active" : ""}`}
            onClick={() => setTab("user")}
          >
            User Bets
          </button>
        </div>

        <form className="bet-tools" onSubmit={searchUser}>
          <div className="bet-search">
            <input
              className="bet-input"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="Enter User ID"
            />
            <button className="bet-btn" type="submit">
              Search User
            </button>
          </div>

          {tab !== "user" && (
            <>
              <select
                className="bet-select"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All Status</option>
                <option value="0">Pending</option>
                <option value="1">Win</option>
                <option value="2">Loss</option>
              </select>

              <select
                className="bet-select"
                value={betType}
                onChange={(e) => {
                  setPage(1);
                  setBetType(e.target.value);
                }}
              >
                <option value="">All Direction</option>
                <option value="up">UP</option>
                <option value="down">DOWN</option>
              </select>
            </>
          )}
        </form>

        {error && <div className="error">{error}</div>}

        <div className="bet-table-wrap">
          {loading ? (
            <div className="loader">Loading bets...</div>
          ) : rows.length === 0 ? (
            <div className="empty">No bets found</div>
          ) : (
            <table className="bet-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User ID</th>
                  <th>Bet</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Order ID</th>
                  <th>Period</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item, index) => {
                  const statusInfo = getStatus(item.status);
                  const direction = String(item.bet || "").toLowerCase();

                  return (
                    <tr key={item._id || item.orderId || index}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td>{formatValue(item.userId)}</td>
                      <td
                        className={
                          direction === "up"
                            ? "direction-up"
                            : direction === "down"
                            ? "direction-down"
                            : ""
                        }
                      >
                        {formatValue(item.bet).toUpperCase()}
                      </td>
                      <td>{formatValue(item.amount ?? item.money)}</td>
                      <td>
                        <span className={`status ${statusInfo.className}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td>{formatValue(item.orderId)}</td>
                      <td>
                        {formatValue(
                          item.period ?? item.issue ?? item.gameId
                        )}
                      </td>
                      <td>
                        {formatValue(
                          item.time ?? item.createdAt
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bet-footer">
          <div>
            Showing {rows.length} of {total} records
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BetAdmin;
