import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  Dice5,
  Gift,
  History,
  Home as HomeIcon,
  Key,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  PowerIcon,
  Sparkles,
  Star,
  User,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";

const Navbar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Body scroll lock
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  // Menu items matching the design
  const menuItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: Dice5, label: "Matka", path: "/matka/markets" },
    { icon: Activity, label: "Activity", path: "/activity" },
    { icon: PowerIcon, label: "Powerhit", path: "/powerhit" },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  // Account menu items
  const accountMenuItems = [
    { icon: User, label: "Profile", path: "/profile", color: "text-blue-500" },
    {
      icon: PlusCircle,
      label: "Deposit",
      path: "/deposit",
      color: "text-green-500",
    },
    {
      icon: History,
      label: "Deposit History",
      path: "/deposit-history",
      color: "text-purple-500",
    },
    {
      icon: ArrowUpRight,
      label: "Withdrawal",
      path: "/withdrawal",
      color: "text-orange-500",
    },
    {
      icon: ArrowDownLeft,
      label: "Withdrawal History",
      path: "/withdrawal-history",
      color: "text-red-500",
    },
    {
      icon: Gift,
      label: "Refer & Earn",
      path: "/promo",
      color: "text-pink-500",
    },
    {
      icon: ClipboardList,
      label: "All Bet History",
      path: "/bet-history",
      color: "text-indigo-500",
    },
    {
      icon: ClipboardList,
      label: "PowerHit History",
      path: "/powerhit/history",
      color: "text-indigo-500",
    },
    {
      icon: Key,
      label: "Change Password",
      path: "/change-password",
      color: "text-yellow-600",
    },
    {
      icon: MessageCircle,
      label: "Support Chat",
      path: "/support-chat",
      color: "text-cyan-500",
    },
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      setIsSidebarOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActiveRoute = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    return user.name || user.username || "User";
  };

  const getUserSubtitle = () => {
    if (!user) return "";
    return user.email || user.mobile || "";
  };

  const getInitial = () => {
    return getUserDisplayName().charAt(0).toUpperCase();
  };

  const getAvatar = () => {
    const name = getUserDisplayName();

    return (
      user?.profilePic ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name,
      )}&background=FBBF24&color=fff&size=128`
    );
  };

  const getAvatarGradient = () => {
    const gradients = [
      "from-yellow-400 to-orange-500",
      "from-blue-400 to-purple-500",
      "from-green-400 to-teal-500",
      "from-pink-400 to-rose-500",
      "from-indigo-400 to-blue-500",
    ];
    const index = getUserDisplayName().length % gradients.length;
    return gradients[index];
  };

  // WINZOX Logo Component
  const WinzoxLogo = ({ className = "h-48" }) => (
    <img
      src="https://i.ibb.co/bRDCrgMB/4f0fb13d-8dd5-44fd-9bfa-d1e47e94d5a7.png"
      alt="WINZOX"
      className={`${className} object-contain w-auto`}
    />
  );

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 md:bg-white/95 md:backdrop-blur-xl md:z-50 shadow-2xl shadow-gray-200/50 border-r border-white/40 perspective-1000">
        <div className="flex flex-col h-full transform-gpu rotate-y-0 hover:rotate-y-2 transition-all duration-700 ease-out [transform-style:preserve-3d]">
          {/* Brand with WINZOX Logo */}
          <div className="flex items-center justify-center h-32 px-6 border-b border-white/40 transform-gpu hover:translate-z-8 transition-all duration-500 bg-gradient-to-r from-yellow-50/40 to-orange-50/40">
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-orange-500 blur-2xl opacity-20 group-hover:opacity-50 transition-all duration-500 animate-pulse-slow"></div>
                <div className="relative transform-gpu group-hover:scale-105 group-hover:rotate-y-6 transition-all duration-500 [transform-style:preserve-3d]">
                  <WinzoxLogo className="h-52" />
                  <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </Link>
          </div>

          {/* Tagline */}
          <div className="px-6 py-3 bg-white/60 mx-4 mt-3 rounded-2xl border border-gray-200/50 shadow-lg transform-gpu hover:translate-z-6 hover:scale-105 transition-all duration-500 [transform-style:preserve-3d] backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest">
              <Sparkles size={14} className="text-yellow-500 animate-sparkle" />
              <span className="text-gray-700">PLAY • WIN • REPEAT</span>
              <Sparkles size={14} className="text-yellow-500 animate-sparkle" />
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent relative z-10">
            <div className="space-y-1.5">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-500 group relative cursor-pointer ${
                    isActiveRoute(item.path)
                      ? "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-600 shadow-xl shadow-yellow-500/15 border border-yellow-200/40 transform-gpu hover:translate-x-3 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 [transform-style:preserve-3d]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 transform-gpu hover:translate-x-3 hover:scale-105 hover:shadow-xl [transform-style:preserve-3d]"
                  }`}
                  style={{ pointerEvents: "auto" }}
                >
                  {isActiveRoute(item.path) && (
                    <div className="absolute left-0 top-[9%] -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-r-full shadow-lg shadow-yellow-500/50 animate-pulse-slow pointer-events-none"></div>
                  )}
                  <div className="relative pointer-events-none">
                    <item.icon
                      size={22}
                      className={`transition-all duration-500 group-hover:scale-110 group-hover:rotate-y-6 [transform-style:preserve-3d] ${
                        isActiveRoute(item.path)
                          ? "text-yellow-500"
                          : "text-gray-400 group-hover:text-gray-700"
                      }`}
                    />
                    {isActiveRoute(item.path) && (
                      <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse-slow pointer-events-none"></div>
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold pointer-events-none ${
                      isActiveRoute(item.path)
                        ? "text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActiveRoute(item.path) && (
                    <ChevronRight
                      size={18}
                      className="ml-auto text-yellow-500 transform-gpu group-hover:translate-x-2 transition-transform duration-300 pointer-events-none"
                    />
                  )}
                </Link>
              ))}
            </div>
            {/* Account Section */}
            {isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-white/40 relative z-10">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 rounded-2xl transition-all duration-500 group transform-gpu hover:translate-x-2 hover:scale-105 [transform-style:preserve-3d] cursor-pointer relative z-10"
                  type="button"
                >
                  <span className="flex items-center gap-3 pointer-events-none">
                    <User
                      size={20}
                      className="text-gray-400 group-hover:text-gray-700 transition-colors duration-300 pointer-events-none"
                    />
                    <span className="text-sm font-bold pointer-events-none">
                      Account
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-all duration-500 text-gray-400 pointer-events-none ${
                      isAccountMenuOpen ? "rotate-180 text-yellow-500" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    isAccountMenuOpen
                      ? "max-h-[600px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-2 py-2 space-y-1.5">
                    {accountMenuItems.map((item, index) => {
                      const isActive =
                        location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`);

                      return (
                        <Link
                          key={index}
                          to={item.path}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300 group transform-gpu hover:translate-x-2 hover:scale-105 [transform-style:preserve-3d] cursor-pointer relative z-10 ${
                            isActive
                              ? "bg-gradient-to-r from-yellow-50/80 to-orange-50/80 text-yellow-600 font-semibold shadow-lg shadow-yellow-500/10 border border-yellow-200/50"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60"
                          }`}
                          style={{ pointerEvents: "auto" }}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-r-full shadow-lg shadow-yellow-500/50"></div>
                          )}
                          <item.icon
                            size={18}
                            className={`transition-all duration-300 group-hover:scale-110 group-hover:rotate-y-3 [transform-style:preserve-3d] pointer-events-none ${
                              isActive
                                ? "text-yellow-500 scale-110"
                                : item.color || "text-gray-400"
                            }`}
                          />
                          <span
                            className={`pointer-events-none ${isActive ? "text-yellow-600" : ""}`}
                          >
                            {item.label}
                          </span>
                          {isActive && (
                            <ChevronRight
                              size={14}
                              className="ml-auto text-yellow-500 pointer-events-none"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Footer with Logout */}
          <div className="border-t border-white/40 p-4 bg-gradient-to-b from-gray-50/30 to-white/30 transform-gpu hover:translate-z-6 transition-all duration-500 [transform-style:preserve-3d] backdrop-blur-sm">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-gray-600 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50/60 hover:to-red-50/30 w-full transition-all duration-500 group disabled:opacity-50 transform-gpu hover:scale-105 hover:shadow-xl [transform-style:preserve-3d]"
              >
                <LogOut
                  size={20}
                  className="text-gray-400 group-hover:text-red-500 transition-colors duration-300 group-hover:rotate-y-6 [transform-style:preserve-3d]"
                />
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Circle className="animate-spin" size={16} />
                    Logging out...
                  </span>
                ) : (
                  "Logout"
                )}
              </button>
            ) : (
              <div className="space-y-2.5">
                <Link
                  to="/login"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 transition-all duration-500 group transform-gpu hover:translate-x-2 hover:scale-105 [transform-style:preserve-3d]"
                >
                  <LogIn
                    size={20}
                    className="text-gray-400 group-hover:text-gray-700 transition-colors duration-300 group-hover:rotate-y-6 [transform-style:preserve-3d]"
                  />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 text-black font-bold hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-500 group transform-gpu hover:scale-105 hover:-translate-y-1 hover:rotate-y-3 [transform-style:preserve-3d]"
                >
                  <UserPlus
                    size={20}
                    className="group-hover:scale-110 group-hover:rotate-y-6 transition-all duration-500 [transform-style:preserve-3d]"
                  />
                  Register Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="md:ml-72 flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* ================= TOP NAVBAR ================= */}
        <div className="h-16 border-b border-white/40 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-gray-100/50 transform-gpu">
          <div className="h-full flex items-center px-4 sm:px-6">
            {/* Left - Menu Button & Logo */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button */}
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSidebarOpen(!isSidebarOpen);
                }}
                className="md:hidden text-gray-700 hover:text-yellow-500 transition-all duration-500 p-2 -ml-2 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 rounded-2xl transform-gpu hover:scale-110 hover:rotate-y-6 [transform-style:preserve-3d]"
                aria-label="Toggle menu"
              >
                <Menu size={22} />
              </button>

              {/* Logo - Always Left Aligned */}
              <Link
                to="/"
                className="flex items-center transform-gpu hover:scale-105 transition-all duration-500"
              >
                <WinzoxLogo className="h-12 md:h-10" />
              </Link>
            </div>

            {/* Center - Empty for spacing */}
            <div className="flex-1"></div>

            {/* Right - Login & Register Buttons */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Desktop Avatar/Name */}
                  <Link
                    to="/account"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-black hover:shadow-2xl transition-all duration-500"
                  >
                    <img
                      src={getAvatar()}
                      alt={getUserDisplayName()}
                      className="w-7 h-7 rounded-full object-cover border-2 border-yellow-400 shadow-lg transform-gpu hover:scale-110 transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          getUserDisplayName(),
                        )}&background=FBBF24&color=fff&size=128`;
                      }}
                    />
                    <span className="text-sm font-bold">
                      {getUserDisplayName()}
                    </span>
                  </Link>

                  {/* Mobile Avatar only */}
                  <Link to="/account" className="md:hidden flex items-center">
                    <img
                      src={getAvatar()}
                      alt={getUserDisplayName()}
                      className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400 shadow-lg transform-gpu hover:scale-110 transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          getUserDisplayName(),
                        )}&background=FBBF24&color=fff&size=128`;
                      }}
                    />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-400 text-black text-sm"
                  >
                    <LogIn size={16} />
                    <span className="hidden sm:inline">LOGIN</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex ml-3 items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black text-sm"
                  >
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">REGISTER</span>
                    <span className="sm:hidden">Register</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================= PAGE CONTENT ================= */}
        <div className="flex-1 pb-[4rem] md:pb-6">{children}</div>
      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden perspective-1000">
        <div className="relative mx-auto max-w-full">
          <div className="relative h-[72px] bg-white/95 backdrop-blur-xl rounded-t-3xl border-t border-white/40 shadow-[0_-8px_40px_rgba(0,0,0,0.08)] transform-gpu translate-y-0 transition-all duration-700 [transform-style:preserve-3d]">
            {/* Grid Layout - 5 columns */}
            <div className="grid grid-cols-5 h-full w-full">
              {/* Home */}
              <Link
                to="/"
                className={`flex flex-col items-center justify-center text-[10px] transition-all duration-500 relative ${
                  location.pathname === "/"
                    ? "text-yellow-600"
                    : "text-gray-500 hover:text-yellow-600"
                } transform-gpu hover:scale-110 hover:-translate-y-2 hover:rotate-y-6 [transform-style:preserve-3d]`}
              >
                <HomeIcon
                  size={20}
                  strokeWidth={location.pathname === "/" ? 2.5 : 2}
                  className={`transition-all duration-500 ${
                    location.pathname === "/"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                />
                <span className="mt-0.5 font-bold text-[10px]">Home</span>
                {location.pathname === "/" && (
                  <div className="absolute top-[3.5rem] w-8 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/40 animate-pulse-slow"></div>
                )}
              </Link>

              {/* Activity */}
              <Link
                to="/activity"
                className={`flex flex-col items-center justify-center text-[10px] transition-all duration-500 relative ${
                  location.pathname === "/activity"
                    ? "text-yellow-600"
                    : "text-gray-500 hover:text-yellow-600"
                } transform-gpu hover:scale-110 hover:-translate-y-2 hover:rotate-y-6 [transform-style:preserve-3d]`}
              >
                <Activity
                  size={20}
                  strokeWidth={location.pathname === "/activity" ? 2.5 : 2}
                  className={`transition-all duration-500 ${
                    location.pathname === "/activity"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                />
                <span className="mt-0.5 font-bold text-[10px]">Activity</span>
                {location.pathname === "/activity" && (
                  <div className="absolute top-[3.5rem] w-8 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/40 animate-pulse-slow"></div>
                )}
              </Link>

              {/* Empty Space for Floating Button */}
              <div></div>

              {/* Wallet */}
              <Link
                to="/wallet"
                className={`flex flex-col items-center justify-center text-[10px] transition-all duration-500 relative ${
                  location.pathname === "/wallet"
                    ? "text-yellow-600"
                    : "text-gray-500 hover:text-yellow-600"
                } transform-gpu hover:scale-110 hover:-translate-y-2 hover:rotate-y-6 [transform-style:preserve-3d]`}
              >
                <Wallet
                  size={20}
                  strokeWidth={location.pathname === "/wallet" ? 2.5 : 2}
                  className={`transition-all duration-500 ${
                    location.pathname === "/wallet"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                />
                <span className="mt-0.5 font-bold text-[10px]">Wallet</span>
                {location.pathname === "/wallet" && (
                  <div className="absolute top-[3.5rem] w-8 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/40 animate-pulse-slow"></div>
                )}
              </Link>

              {/* Profile */}
              <Link
                to="/account"
                className={`flex flex-col items-center justify-center text-[10px] transition-all duration-500 relative ${
                  location.pathname === "/profile"
                    ? "text-yellow-600"
                    : "text-gray-500 hover:text-yellow-600"
                } transform-gpu hover:scale-110 hover:-translate-y-2 hover:rotate-y-6 [transform-style:preserve-3d]`}
              >
                <User
                  size={20}
                  strokeWidth={location.pathname === "/account" ? 2.5 : 2}
                  className={`transition-all duration-500 ${
                    location.pathname === "/account"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                />
                <span className="mt-0.5 font-bold text-[10px]">Account</span>
                {location.pathname === "/account" && (
                  <div className="absolute top-[3.5rem] w-8 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-500/40 animate-pulse-slow"></div>
                )}
              </Link>
            </div>

            {/* Floating Promo Button with 3D */}
            <Link
              to="/promo"
              className="absolute left-1/2 -translate-x-1/2 -top-7 group perspective-1000"
            >
              <div className="relative transform-gpu transition-all duration-700 hover:rotate-y-12 hover:scale-110 hover:-translate-y-2 [transform-style:preserve-3d]">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-2xl opacity-30 group-hover:opacity-70 transition-all duration-700 animate-pulse-slow"></div>
                <div className="w-[78px] h-[78px] rounded-full bg-white shadow-2xl relative">
                  <div
                    className="w-full h-full rounded-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
                  >
                    <div
                      className="w-full h-full rounded-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex flex-col items-center justify-center group-hover:scale-105 transition-all duration-500"
                    >
                      <Gift
                        size={22}
                        className="text-black"
                        strokeWidth={2.3}
                      />
                      <span className="text-[9px] font-bold text-black leading-none mt-0.5">
                        Promo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
                  <Star size={10} className="text-white" fill="white" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-500 ${
          isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsSidebarOpen(false);
          }
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        <div
          ref={sidebarRef}
          className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-all duration-500 ease-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } perspective-1000`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full transform-gpu hover:rotate-y-2 transition-all duration-700 [transform-style:preserve-3d]">
            {/* Header */}
            <div className="flex items-center justify-center p-4 border-b border-white/40 bg-gradient-to-r from-yellow-50/40 to-orange-50/40">
              <Link
                to="/"
                onClick={() => setIsSidebarOpen(false)}
                className="transform-gpu hover:scale-105 hover:rotate-y-6 transition-all duration-500 [transform-style:preserve-3d]"
              >
                <WinzoxLogo className="h-16" />
              </Link>
            </div>

            {/* Tagline */}
            <div className="px-4 py-2 mx-4 mt-2 bg-white/60 rounded-2xl border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-700 tracking-widest font-bold">
                <Sparkles
                  size={10}
                  className="text-yellow-500 animate-sparkle"
                />
                <span className="text-gray-700">PLAY • WIN • REPEAT</span>
                <Sparkles
                  size={10}
                  className="text-yellow-500 animate-sparkle"
                />
              </div>
            </div>

            {/* User Info */}
            {isAuthenticated && user && (
              <div className="px-4 py-4 border-b border-white/40 bg-gradient-to-r from-yellow-50/30 to-orange-50/30">
                <Link
                  to="/account"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={getAvatar()}
                    alt={getUserDisplayName()}
                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400 shadow-lg transform-gpu group-hover:scale-110 group-hover:rotate-y-6 transition-all duration-500 [transform-style:preserve-3d]"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        getUserDisplayName(),
                      )}&background=FBBF24&color=fff&size=128`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {getUserSubtitle()}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover:text-yellow-500 transition-colors"
                  />
                </Link>
              </div>
            )}

            {/* Navigation */}
            <div className="px-3 py-4 overflow-y-auto h-[calc(100%-14rem)] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="space-y-1.5">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-500 [transform-style:preserve-3d] ${
                      isActiveRoute(item.path)
                        ? "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-600 border border-yellow-200/30 transform-gpu scale-105 shadow-lg shadow-yellow-500/15"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 transform-gpu hover:translate-x-2 hover:scale-105"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={
                        isActiveRoute(item.path)
                          ? "text-yellow-500"
                          : "text-gray-400"
                      }
                    />
                    <span className="text-sm font-bold">{item.label}</span>
                    {isActiveRoute(item.path) && (
                      <ChevronRight
                        size={16}
                        className="ml-auto text-yellow-500"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full border-t border-white/40 p-4 bg-gradient-to-b from-gray-50/30 to-white/30">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-gray-600 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50/60 hover:to-red-50/30 w-full transition-all duration-500 disabled:opacity-50 transform-gpu hover:scale-105 [transform-style:preserve-3d]"
                >
                  <LogOut size={20} />
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Circle className="animate-spin" size={16} />
                      Logging out...
                    </span>
                  ) : (
                    "Logout"
                  )}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    to="/login"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 transition-all duration-500 transform-gpu hover:translate-x-2 [transform-style:preserve-3d]"
                  >
                    <LogIn size={20} className="text-gray-400" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 text-black font-bold hover:shadow-2xl hover:shadow-yellow-500/40 transition-all duration-500 transform-gpu hover:scale-105 [transform-style:preserve-3d]"
                  >
                    <UserPlus size={20} />
                    Register Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-surface {
          background-color: #f7f9fb;
        }
        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) rotateX(-15deg) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotateX(0) scale(1);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 9999px;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
        }
        .animate-sparkle {
          animation: sparkle 2.5s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-gpu {
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }
        [transform-style="preserve-3d"] {
          transform-style: preserve-3d;
        }
        .hover\\:translate-x-2:hover {
          transform: translateX(0.5rem);
        }
        .hover\\:translate-x-3:hover {
          transform: translateX(0.75rem);
        }
        .hover\\:translate-z-6:hover {
          transform: translateZ(1.5rem);
        }
        .hover\\:translate-z-8:hover {
          transform: translateZ(2rem);
        }
        .hover\\:rotate-y-2:hover {
          transform: rotateY(2deg);
        }
        .hover\\:rotate-y-3:hover {
          transform: rotateY(3deg);
        }
        .hover\\:rotate-y-6:hover {
          transform: rotateY(6deg);
        }
        .hover\\:rotate-y-12:hover {
          transform: rotateY(12deg);
        }
        .hover\\:scale-105 {
          transform: scale(1.05);
        }
        .hover\\:scale-110 {
          transform: scale(1.1);
        }
        .hover\\:-translate-y-1:hover {
          transform: translateY(-0.25rem);
        }
        .hover\\:-translate-y-2:hover {
          transform: translateY(-0.5rem);
        }
        .hover\\:-translate-y-3:hover {
          transform: translateY(-0.75rem);
        }
        .hover\\:shadow-2xl:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
};

export default Navbar;
