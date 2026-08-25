import {
  ArrowLeftFromLine,
  ArrowRight,
  ArrowRightFromLine,
  Award,
  Calendar,
  Clock,
  Coins,
  Crown,
  Dice5,
  Eye,
  Gamepad2,
  Gem,
  Hash,
  Inbox,
  List,
  Moon,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getTodayBidsSummary } from "../../redux/slices/bidSlice";
import { getActiveMarkets } from "../../redux/slices/marketSlice";
import { getTodayResults } from "../../redux/slices/resultSlice";

// Helper function to get currency symbol based on country
const getCurrencySymbol = (country) => {
  const symbols = {
    IN: "₹",
    US: "$",
    GB: "£",
    EU: "€",
    JP: "¥",
    CN: "¥",
    AU: "$",
    CA: "$",
    SG: "S$",
    MY: "RM",
    AE: "د.إ",
    SA: "﷼",
    default: "₹",
  };
  return symbols[country] || symbols.default;
};

const MatkaDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { todaySummary } = useSelector((state) => state.bid);
  const { todayResults } = useSelector((state) => state.result);
  const { activeMarkets } = useSelector((state) => state.market);
  const { loading } = useSelector((state) => state.bid);

  // Get currency symbol based on user's country
  const currencySymbol = getCurrencySymbol(user?.country);

  // Format currency function using the currency symbol
  const formatCurrency = (amount) => {
    return `${currencySymbol}${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    dispatch(getTodayBidsSummary());
    dispatch(getTodayResults());
    dispatch(getActiveMarkets());
  }, [dispatch]);

  // ✅ Helper to get winning number display from result
  const getWinningNumberDisplay = (result) => {
    if (!result?.winningNumber) return "-";
    
    // If winningNumber is an object (multiple game types)
    if (typeof result.winningNumber === 'object') {
      const entries = Object.entries(result.winningNumber).filter(
        ([_, value]) => value !== null && value !== ""
      );
      if (entries.length === 0) return "-";
      // Return first winning number
      return entries[0][1];
    }
    
    // If winningNumber is a string
    return result.winningNumber;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse"></div>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const recentWins = todaySummary?.won?.totalBids || 0;
  const totalWonAmount = todaySummary?.won?.totalAmount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-2xl p-5 sm:p-8 text-white overflow-hidden transform group-hover:scale-[1.01] transition duration-500">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-white rounded-full filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-36 h-36 sm:w-72 sm:h-72 bg-white rounded-full filter blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-lg rounded-full p-1.5 sm:p-2 shadow-lg border border-white/30">
                    <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-300 fill-yellow-300" />
                  </div>
                  <span className="text-amber-100 font-semibold tracking-wider uppercase text-[10px] sm:text-xs bg-white/20 backdrop-blur-lg px-2 py-1 sm:px-3 sm:py-1 rounded-full border border-white/30">
                    VIP
                  </span>
                </div>
                <Link
                  to="/matka/markets"
                  className="group/btn relative px-4 py-2 sm:px-6 sm:py-3 bg-white text-amber-600 rounded-xl sm:rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-1.5 sm:gap-2 active:scale-95 overflow-hidden text-xs sm:text-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 opacity-0 group-hover/btn:opacity-100 transition duration-300"></div>
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Target size={14} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden xs:inline">Place</span> Bid
                    <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                  </span>
                </Link>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold flex items-center gap-2 flex-wrap">
                  Welcome back, {user?.name?.split(" ")[0] || "User"}!
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse" />
                </h1>
                <p className="text-amber-100/90 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                  Today's Matka summary
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-amber-500 rounded-full filter blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur-md"></div>
                  <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2 sm:p-3 shadow-lg">
                    <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">
                    Available Balance
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent truncate">
                    {formatCurrency(user?.balance?.local || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-gray-400 text-xs bg-gray-50/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-gray-200">
                <span className="inline-flex items-center gap-1.5 text-green-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  Updated: Today
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: Target,
              gradient: "from-blue-400 to-indigo-500",
              label: "Bids",
              value: todaySummary?.totalBids || 0,
            },
            {
              icon: Coins,
              gradient: "from-purple-400 to-violet-500",
              label: "Amount",
              value: formatCurrency(todaySummary?.totalAmount || 0),
            },
            {
              icon: TrendingUp,
              gradient: "from-green-400 to-emerald-500",
              label: "Markets",
              value: activeMarkets?.length || 0,
            },
            {
              icon: Trophy,
              gradient: "from-amber-400 to-orange-500",
              label: "Wins",
              value: recentWins > 0 ? `+${recentWins}` : "0",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4 overflow-hidden"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                >
                  <stat.icon size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
                    {stat.label}
                  </p>
                  <p className="text-base sm:text-xl font-extrabold text-gray-800 truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Results */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100/50 bg-gradient-to-r from-amber-50/30 to-orange-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur-sm"></div>
                    <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-1.5 sm:p-2.5 shadow-lg">
                      <Calendar size={16} className="text-white sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-lg font-extrabold text-gray-800 flex items-center gap-2">
                      Today's Results
                      <span className="text-[10px] sm:text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                        Live
                      </span>
                    </h2>
                    <p className="text-gray-500 text-[10px] sm:text-xs hidden xs:block">
                      Latest winning numbers
                    </p>
                  </div>
                </div>
                <Link
                  to="/matka/results"
                  className="text-amber-600 text-xs sm:text-sm font-bold flex items-center gap-1 bg-amber-50/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl hover:bg-amber-100/80 transition-all duration-300 border border-amber-200/50 active:scale-95"
                >
                  View All
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>

            {todayResults?.length > 0 ? (
              <div className="divide-y divide-gray-100/50">
                {todayResults.slice(0, 5).map((result, index) => {
                  // ✅ Get winning number display
                  const winningNumber = getWinningNumberDisplay(result);
                  
                  return (
                    <div
                      key={result._id}
                      className="p-4 sm:p-5 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 transition-all duration-300 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                          <span className="font-bold text-gray-800 text-sm sm:text-base truncate">
                            {result.marketName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-black rounded-xl text-base sm:text-xl border border-green-200 shadow-lg shadow-green-500/10">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            {winningNumber}
                          </span>
                        </div>
                        <span className="font-extrabold text-transparent bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-sm sm:text-base">
                          {formatCurrency(result.totalPayout || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                    <Inbox size={40} className="text-amber-500 sm:w-14 sm:h-14" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-gray-700 font-bold text-base sm:text-xl">
                  No results today
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Results appear once announced
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {[
            {
              to: "/matka/markets",
              icon: Target,
              label: "Bid",
              sub: "Play now",
              gradient: "from-amber-400 to-orange-500",
            },
            {
              to: "/matka/bids-history",
              icon: List,
              label: "Bids",
              sub: "History",
              gradient: "from-purple-400 to-violet-500",
            },
            {
              to: "/matka/results",
              icon: Eye,
              label: "Results",
              sub: "Winners",
              gradient: "from-green-400 to-emerald-500",
            },
          ].map((link, index) => {
            const Icon = link.icon;
            return (
              <Link
                key={index}
                to={link.to}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-3 sm:p-5 text-center transition-all duration-300 active:scale-95"
              >
                <div className="flex justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r ${link.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <Icon size={18} className="text-white sm:w-7 sm:h-7" />
                  </div>
                </div>
                <p className="font-extrabold text-gray-700 text-xs sm:text-base group-hover:text-amber-600 transition">
                  {link.label}
                </p>
                <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5 hidden xs:block">
                  {link.sub}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] sm:text-xs text-gray-400 pt-2 sm:pt-4">
          <span className="inline-flex items-center gap-1">
            <Gem size={10} className="text-amber-400 sm:w-3 sm:h-3" />
            Premium Dashboard • Live results
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatkaDashboard;