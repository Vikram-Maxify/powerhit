import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Lock,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ChangePassword from "../components/ChangePassword";
import { getProfile } from "../redux/slices/authSlice";
import ProfileContent from "./ProfileContent";

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, loading, profileLoaded } = useSelector((state) => state.auth);

  // Get currency symbol based on user's country
  const currencySymbol = getCurrencySymbol(user?.country);

  // Format currency function with proper number formatting
  const formatCurrency = (amount) => {
    return `${currencySymbol}${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    if (!profileLoaded && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, profileLoaded, loading]);

  const menu = [
    { id: "profile", title: "Profile", icon: User },
    { id: "password", title: "Change Password", icon: Lock },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    navigate("/login");
  };

  const getUserDisplayName = () => user?.name || user?.mobile || "User";
  const getUserId = () => (user?._id ? `@${user._id.slice(-8)}` : "@user");
  const getAvatar = () => {
    const name = user?.name || "User";

    return (
      user?.profilePic ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name,
      )}&background=amber&color=fff&size=128`
    );
  };
  return (
    <div className="min-h-screen bg-slate-100 ">
      {/* Mobile Header */}
      <div className="lg:hidden p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Winzox Profile</h2>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black flex items-center justify-center"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <div className="h-full flex gap-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0 h-full">
          <DesktopSidebar
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleLogout={handleLogout}
            navigate={navigate}
            getUserDisplayName={getUserDisplayName}
            getUserId={getUserId}
            getAvatar={getAvatar}
            formatCurrency={formatCurrency}
            currencySymbol={currencySymbol}
          />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          navigate={navigate}
          getUserDisplayName={getUserDisplayName}
          getUserId={getUserId}
          getAvatar={getAvatar}
          menu={menu}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />

        {/* Right Content */}
        <div className="flex-1 h-full overflow-auto sm:pb-20 md:pb-0 md:px-2">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg">
            {activeTab === "profile" && (
              <ProfileContent
                formatCurrency={formatCurrency}
                currencySymbol={currencySymbol}
              />
            )}
            {activeTab === "password" && <ChangePassword />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DESKTOP SIDEBAR COMPONENT
// ============================================================
function DesktopSidebar({
  user,
  activeTab,
  setActiveTab,
  handleLogout,
  navigate,
  getUserDisplayName,
  getUserId,
  getAvatar,
  formatCurrency,
  currencySymbol,
}) {
  const menu = [
    { id: "profile", title: "Profile", icon: User },
    { id: "password", title: "Change Password", icon: Lock },
  ];

  return (
    <div className="h-full bg-white shadow-lg border-r border-gray-200 overflow-y-auto flex flex-col md:pl-2">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={getAvatar()}
              alt={getUserDisplayName()}
              className="w-20 h-20 rounded-full border-4 border-amber-400 object-cover"
            />
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">
              {getUserDisplayName()}
            </h2>
            <p className="text-gray-500">{getUserId()}</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              <BadgeCheck size={14} />
              {user?.membership || "Silver Member"}
            </div>
          </div>
        </div>

        <div
          className="mt-8 rounded-2xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-white p-5"
        >
          <p className="text-sm opacity-90">Available Balance</p>
          <h2 className="text-4xl font-bold mt-2">
            {formatCurrency(user?.balance.local || 0)}
          </h2>
        </div>
      </div>

      <div className="border-t border-gray-200 flex-shrink-0" />

      <div className="p-4 space-y-2 flex-1">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full rounded-xl px-5 py-4 flex items-center gap-3 font-semibold transition ${
                activeTab === item.id
                  ? "bg-amber-100 border border-amber-300 text-amber-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Icon size={20} />
              {item.title}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-200 p-4 space-y-3 flex-shrink-0">
        <button
          onClick={() => navigate("/deposit")}
          className="w-full h-12 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-white font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition"
        >
          <ArrowUp size={18} />
          Deposit Funds
        </button>
        <button
          onClick={() => navigate("/withdraw")}
          className="w-full h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition"
        >
          <ArrowDown size={18} />
          Withdraw Funds
        </button>
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MOBILE SIDEBAR COMPONENT
// ============================================================
function MobileSidebar({
  isOpen,
  setIsOpen,
  user,
  activeTab,
  setActiveTab,
  handleLogout,
  navigate,
  getUserDisplayName,
  getUserId,
  getAvatar,
  menu,
  formatCurrency,
  currencySymbol,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        isOpen ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/50"
      />
      <div
        className={`absolute left-0 top-0 h-full w-80 bg-white transition-transform duration-300 shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold text-gray-800">Winzox</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <img
              src={getAvatar()}
              alt={getUserDisplayName()}
              className="w-16 h-16 rounded-full border-4 border-amber-400 object-cover"
            />
            <div>
              <h3 className="font-bold text-lg">{getUserDisplayName()}</h3>
              <p className="text-gray-500 text-sm">{getUserId()}</p>
            </div>
          </div>
          <div
            className="mt-6 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] p-4 text-black"
          >
            <p className="text-sm">Available Balance</p>
            <h2 className="text-3xl font-bold mt-1">
              {formatCurrency(user?.balance.local || 0)}
            </h2>
          </div>
        </div>

        <div className="px-4 space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl px-5 py-4 flex items-center gap-3 transition ${
                  activeTab === item.id
                    ? "bg-amber-100 border border-amber-300 text-amber-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Icon size={20} />
                {item.title}
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 w-full border-t p-4 space-y-3 bg-white">
          <button
            onClick={() => {
              navigate("/deposit");
              setIsOpen(false);
            }}
            className="w-full h-12 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-white font-semibold"
          >
            Deposit
          </button>
          <button
            onClick={() => {
              navigate("/withdraw");
              setIsOpen(false);
            }}
            className="w-full h-12 rounded-xl border border-gray-300 font-semibold"
          >
            Withdraw
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
