// pages/WalletDashboard.jsx
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Eye,
  EyeOff,
  Gift,
  History,
  Home,
  User,
  Wallet as WalletIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getMyDeposits } from "../redux/slices/depositSlice";
import { fetchWithdrawalHistory } from "../redux/slices/withdrawalSlice";

// ======================================================
// CURRENCY CONFIG
// ======================================================

const getCurrencyConfig = (countryCode) => {
  const config = {
    IN: { symbol: "₹", code: "INR", locale: "en-IN" },
    NP: { symbol: "रु", code: "NPR", locale: "ne-NP" },
    PK: { symbol: "Rs", code: "PKR", locale: "en-PK" },
    AU: { symbol: "$", code: "AUD", locale: "en-AU" },
    CA: { symbol: "$", code: "CAD", locale: "en-CA" },
    AE: { symbol: "د.إ", code: "AED", locale: "ar-AE" },
    default: { symbol: "₹", code: "INR", locale: "en-IN" },
  };
  return config[countryCode] || config.default;
};

// ======================================================
// COMPONENT
// ======================================================

export default function WalletDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showBalance, setShowBalance] = useState(true);

  // ======================================================
  // CURRENCY
  // ======================================================

  const currencyConfig = getCurrencyConfig(user?.country);
  const currencySymbol = currencyConfig.symbol;

  // ======================================================
  // REDUX STATE
  // ======================================================

  const depositState = useSelector((state) => state.deposit);
  const withdrawalState = useSelector((state) => state.withdrawal);

  const depositsFromStore = depositState?.deposits || [];
  const withdrawalsFromStore = withdrawalState?.history || [];
  const isDepositLoading = depositState?.loading || false;
  const isWithdrawalLoading = withdrawalState?.loading || false;

  const walletBalance = user?.balance;

  // ======================================================
  // EFFECTS
  // ======================================================

  useEffect(() => {
    dispatch(getMyDeposits());
    dispatch(fetchWithdrawalHistory());
  }, [dispatch]);

  // ======================================================
  // FORMAT FUNCTIONS
  // ======================================================

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeDeposit = (d) => ({
    id: d.id || d._id?.slice(-8).toUpperCase() || "N/A",
    date: d.date || formatDate(d.createdAt || d.requestedAt),
    amount: d.amount,
    status: d.status
      ? d.status.charAt(0).toUpperCase() + d.status.slice(1)
      : "Success",
  });

  const normalizeWithdrawal = (w) => ({
    id: w.id || w._id?.slice(-8).toUpperCase() || "N/A",
    date: w.date || formatDate(w.requestedAt || w.createdAt),
    amount: w.amount,
    status: w.status
      ? w.status.charAt(0).toUpperCase() + w.status.slice(1)
      : "Success",
  });

  const deposits = depositsFromStore.map(normalizeDeposit);
  const withdrawals = withdrawalsFromStore.map(normalizeWithdrawal);

  const formatAmount = (amount) =>
    `${currencySymbol}${Number(amount).toLocaleString("en-IN")}`;

  const formatBalance = (amount) =>
    `${currencySymbol}${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "bg-amber-50 text-amber-600";
    if (s === "failed" || s === "rejected") return "bg-red-50 text-red-600";
    if (s === "processing") return "bg-blue-50 text-blue-600";
    return "bg-[#EFEDE8] text-gray-600";
  };

  // ======================================================
  // EMPTY STATE COMPONENT
  // ======================================================

  const EmptyState = ({
    type,
    icon: Icon,
    title,
    description,
    actionText,
    onAction,
  }) => {
    const isDeposit = type === "deposit";

    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Icon className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-semibold text-gray-700 mb-1">{title}</h4>
        <p className="text-xs text-gray-400 max-w-[200px] mb-4">
          {description}
        </p>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] text-xs font-semibold text-black shadow-sm hover:scale-[1.02] transition"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-[#F2F2F2] pb-28 font-sans">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="pt-6 pb-4 flex items-center justify-between relative">
          <h1 className="text-xl font-semibold text-gray-900">Wallet</h1>
          <button>
            <Bell className="w-6 h-6 text-gray-800" strokeWidth={1.8} />
          </button>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E8D9AE] bg-gradient-to-br from-[#FCF6E7] to-[#F3E3BC] px-5 py-5 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1.5">
                Current Wallet Balance
              </p>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[28px] leading-none font-bold text-[#B8892E] tracking-tight">
                  {showBalance ? formatBalance(walletBalance) : "••••••••"}
                </h2>
                <button onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <Eye className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
                  ) : (
                    <EyeOff
                      className="w-4 h-4 text-gray-500"
                      strokeWidth={1.8}
                    />
                  )}
                </button>
              </div>
              <div className="border-t border-[#E8D9AE] pt-3">
                <span className="text-sm text-gray-600">
                  Available Balance{" "}
                </span>
                <span className="text-sm font-semibold text-[#B8892E] ml-1">
                  {formatBalance(walletBalance)}
                </span>
              </div>
            </div>
            <img
              src="https://i.ibb.co/8gXCwzjp/wallet.png"
              alt="Wallet illustration"
              className="w-[190px] h-[110px] object-contain -mr-4 flex-shrink-0"
            />
          </div>
        </div>

        {/* Deposit / Withdrawal buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link
            to="/deposit"
            className="flex items-center gap-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm px-3.5 py-3.5"
          >
            <div className="w-9 h-9 rounded-full bg-[#EDF0DC] flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft
                className="w-4 h-4 text-[#8A9A5B]"
                strokeWidth={2.2}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#B8892E] leading-tight">
                Deposit
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                Add money to wallet
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </Link>

          <Link
            to="/withdrawal"
            className="flex items-center gap-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm px-3.5 py-3.5"
          >
            <div className="w-9 h-9 rounded-full bg-[#E3EEF7] flex items-center justify-center flex-shrink-0">
              <ArrowUpRight
                className="w-4 h-4 text-[#5B8CA8]"
                strokeWidth={2.2}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#4F7690] leading-tight">
                Withdrawal
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                Withdraw to bank
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </Link>
        </div>

        {/* Last 10 Deposits */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h3 className="text-[15px] font-semibold text-[#B8892E]">
              Last 10 Deposits
            </h3>
            <button
              onClick={() => navigate("/deposit-history")}
              className="flex items-center gap-0.5 text-sm font-medium text-[#B8892E]"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isDepositLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#B8892E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deposits.length === 0 ? (
            <EmptyState
              type="deposit"
              icon={CircleDollarSign}
              title="No Deposits Yet"
              description="Start your investment journey by making your first deposit today!"
              actionText="Make a Deposit"
              onAction={() => navigate("/deposit")}
            />
          ) : (
            <>
              <div>
                {deposits.slice(0, 5).map((d, i) => (
                  <div
                    key={d.id || i}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#F5EAD3] flex items-center justify-center flex-shrink-0">
                        <ArrowDownLeft
                          className="w-3.5 h-3.5 text-[#C89B3C]"
                          strokeWidth={2.2}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          #{d.id}
                        </p>
                        <p className="text-xs text-gray-500">{d.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(d.amount)}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-medium ${statusBadgeClass(d.status)}`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/deposit-history")}
                className="w-full flex items-center justify-center gap-1 text-sm font-medium text-[#B8892E] py-3 border-t border-gray-100"
              >
                View All Deposits <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Last 10 Withdrawals */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h3 className="text-[15px] font-semibold text-[#B8892E]">
              Last 10 Withdrawals
            </h3>
            <button
              onClick={() => navigate("/withdrawal-history")}
              className="flex items-center gap-0.5 text-sm font-medium text-[#B8892E]"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isWithdrawalLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#B8892E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <EmptyState
              type="withdrawal"
              icon={History}
              title="No Withdrawals Yet"
              description="You haven't made any withdrawals yet. Your funds are safe and ready when you need them."
              actionText="Withdraw Now"
              onAction={() => navigate("/withdrawal")}
            />
          ) : (
            <>
              <div>
                {withdrawals.slice(0, 5).map((w, i) => (
                  <div
                    key={w.id || i}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#F5EAD3] flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight
                          className="w-3.5 h-3.5 text-[#C89B3C]"
                          strokeWidth={2.2}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          #{w.id}
                        </p>
                        <p className="text-xs text-gray-500">{w.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(w.amount)}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-medium ${statusBadgeClass(w.status)}`}
                      >
                        {w.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/withdrawal-history")}
                className="w-full flex items-center justify-center gap-1 text-sm font-medium text-[#B8892E] py-3 border-t border-gray-100"
              >
                View All Withdrawals <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-2 relative">
          <div className="flex items-end justify-between py-2 px-2">
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-1 text-gray-400 py-1 w-1/5"
            >
              <Home className="w-5 h-5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
              onClick={() => navigate("/activity")}
              className="flex flex-col items-center gap-1 text-gray-400 py-1 w-1/5"
            >
              <ClipboardList className="w-5 h-5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Activity</span>
            </button>

            {/* Center raised Promo button */}
            <div className="flex flex-col items-center w-1/5 -mt-8">
              <button
                onClick={() => navigate("/promo")}
                className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F3CE6B] to-[#D9A62B] shadow-lg flex items-center justify-center border-4 border-white"
              >
                <Gift className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
              <span className="text-[10px] font-semibold text-[#C89B3C] mt-0.5">
                For Promo
              </span>
            </div>

            <button
              onClick={() => navigate("/wallet")}
              className="flex flex-col items-center gap-1 text-[#C89B3C] py-1 w-1/5"
            >
              <WalletIcon className="w-5 h-5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Wallet</span>
            </button>
            <button
              onClick={() => navigate("/account")}
              className="flex flex-col items-center gap-1 text-gray-400 py-1 w-1/5"
            >
              <User className="w-5 h-5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
