import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  FileText,
  Bell,
  Settings,
  Image,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LogOut,
  UserCog,
  Shield,
  Globe,
  DollarSign,
  Calculator,
  TrendingUp,
  Zap,
  Award,
  Gift,
  HelpCircle,
  BarChart3,
  ListOrdered,
  ZapIcon,
  Gamepad2,
  Target,
  Trophy,
  Flag,
  MapPin,
  Network,
  Zap as ZapIcon2,  // For Powerhit icon
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({
    settings: true,
    matka: true,
    powerhit: true,
    australia: false,
    pakistan: false,
    bangladesh: false,
    india: false,
    nepal: false,
    uae: false,
  });

  // Auto-expand settings if any settings submenu is active
  useEffect(() => {
    const settingsPaths = [
      "/admin/settings",
      "/admin/deposit-settings",
      "/admin/withdrawal-settings",
      "/admin/security-settings",
      "/admin/ticketsetiings",
      "/admin/referral-levels",
      "/admin/betting-bonus",
    ];
    if (settingsPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, settings: true }));
    }

    // Auto-expand Matka menu if any Matka page is active
    const matkaPaths = [
      "/admin/markets",
      "/admin/bids",
      "/admin/results",
      "/admin/currency-rates",
      "/admin/win-multipliers", // ✅ Added Win Multipliers path
    ];
    if (matkaPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, matka: true }));
    }

    // Auto-expand Powerhit menu if any country page is active
    const powerhitPaths = [
      "/admin/australia/gamecounts",
      "/admin/australia/gameEntries",
      "/admin/australia/powerball-result",
      "/admin/australia/powerball-divisions",
      "/admin/pakistan/gamecounts",
      "/admin/pakistan/gameEntries",
      "/admin/pakistan/powerball-result",
      "/admin/pakistan/powerball-divisions",
      "/admin/bangladesh/gamecounts",
      "/admin/bangladesh/gameEntries",
      "/admin/bangladesh/powerball-result",
      "/admin/bangladesh/powerball-divisions",
      "/admin/india/gamecounts",
      "/admin/india/gameEntries",
      "/admin/india/powerball-result",
      "/admin/india/powerball-divisions",
      "/admin/nepal/gamecounts",
      "/admin/nepal/gameEntries",
      "/admin/nepal/powerball-result",
      "/admin/nepal/powerball-divisions",
      "/admin/uae/gamecounts",
      "/admin/uae/gameEntries",
      "/admin/uae/powerball-result",
      "/admin/uae/powerball-divisions",
    ];
    if (powerhitPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, powerhit: true }));
    }

    // Auto-expand country menus
    const australiaPaths = [
      "/admin/australia/gamecounts",
      "/admin/australia/gameEntries",
      "/admin/australia/powerball-result",
      "/admin/australia/powerball-divisions"
    ];
    if (australiaPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, australia: true, powerhit: true }));
    }

    const pakistanPaths = [
      "/admin/pakistan/gamecounts",
      "/admin/pakistan/gameEntries",
      "/admin/pakistan/powerball-result",
      "/admin/pakistan/powerball-divisions"
    ];
    if (pakistanPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, pakistan: true, powerhit: true }));
    }

    const bangladeshPaths = [
      "/admin/bangladesh/gamecounts",
      "/admin/bangladesh/gameEntries",
      "/admin/bangladesh/powerball-result",
      "/admin/bangladesh/powerball-divisions"
    ];
    if (bangladeshPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, bangladesh: true, powerhit: true }));
    }

    const indiaPaths = [
      "/admin/india/gamecounts",
      "/admin/india/gameEntries",
      "/admin/india/powerball-result",
      "/admin/india/powerball-divisions"
    ];
    if (indiaPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, india: true, powerhit: true }));
    }

    const nepalPaths = [
      "/admin/nepal/gamecounts",
      "/admin/nepal/gameEntries",
      "/admin/nepal/powerball-result",
      "/admin/nepal/powerball-divisions"
    ];
    if (nepalPaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, nepal: true, powerhit: true }));
    }

    const uaePaths = [
      "/admin/uae/gamecounts",
      "/admin/uae/gameEntries",
      "/admin/uae/powerball-result",
      "/admin/uae/powerball-divisions"
    ];
    if (uaePaths.includes(location.pathname)) {
      setExpandedMenus(prev => ({ ...prev, uae: true, powerhit: true }));
    }
  }, [location.pathname]);

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const menus = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
      color: "blue",
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <Users size={20} />,
      color: "green",
    },
    {
      name: "Banners",
      path: "/admin/banners",
      icon: <Image size={20} />,
      color: "purple",
    },
    {
      name: "Deposits",
      path: "/admin/deposits",
      icon: <Wallet size={20} />,
      color: "emerald",
    },
    {
      name: "Withdrawals",
      path: "/admin/withdrawals",
      icon: <CreditCard size={20} />,
      color: "orange",
    },
    {
      name: "Transactions",
      path: "/admin/transactions",
      icon: <ArrowLeftRight size={20} />,
      color: "cyan",
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: <FileText size={20} />,
      color: "red",
    },
    {
      name: "Notifications",
      path: "/admin/notifications",
      icon: <Bell size={20} />,
      color: "pink",
    },

    // ✅ ============ MATKA MENU (with Win Multipliers) ============
    {
      name: "Matka Game",
      icon: <Gamepad2 size={20} />,
      color: "amber",
      subMenus: [
        {
          name: "Markets",
          path: "/admin/markets",
          icon: <Target size={16} />,
        },
        {
          name: "Bids",
          path: "/admin/bids",
          icon: <Target size={16} />,
        },
        {
          name: "Results",
          path: "/admin/results",
          icon: <Trophy size={16} />,
        },
        {
          name: "Currency Rates",
          path: "/admin/currency-rates",
          icon: <DollarSign size={16} />,
        },
        {
          name: "Win Multipliers", // ✅ Moved here from Settings
          path: "/admin/win-multipliers",
          icon: <Calculator size={16} />,
        },
      ],
    },

    // ✅ ============ POWERHIT MENU ============
    {
      name: "Powerhit",
      icon: <ZapIcon2 size={20} />,
      color: "yellow",
      subMenus: [
        // ✅ Australia
        {
          name: "Australia",
          icon: <Flag size={16} />,
          isCountry: true,
          countryKey: "australia",
          subMenus: [
            {
              name: "Game Counts",
              path: "/admin/australia/gamecounts",
              icon: <ListOrdered size={14} />,
            },
            {
              name: "Game Entries",
              path: "/admin/australia/gameEntries",
              icon: <ZapIcon size={14} />,
            },
            {
              name: "Powerball Result",
              path: "/admin/australia/powerball-result",
              icon: <Trophy size={14} />,
            },
            {
              name: "Powerball Divisions",
              path: "/admin/australia/powerball-divisions",
              icon: <ListOrdered size={14} />,
            },
          ],
        },
        // ✅ Pakistan
        {
          name: "Pakistan",
          icon: <Flag size={16} />,
          isCountry: true,
          countryKey: "pakistan",
          subMenus: [
            {
              name: "Game Counts",
              path: "/admin/pakistan/gamecounts",
              icon: <ListOrdered size={14} />,
            },
            {
              name: "Game Entries",
              path: "/admin/pakistan/gameEntries",
              icon: <ZapIcon size={14} />,
            },
            {
              name: "Powerball Result",
              path: "/admin/pakistan/powerball-result",
              icon: <Trophy size={14} />,
            },
            {
              name: "Powerball Divisions",
              path: "/admin/pakistan/powerball-divisions",
              icon: <ListOrdered size={14} />,
            },
          ],
        },
        // ✅ Bangladesh
        {
          name: "Bangladesh",
          icon: <Flag size={16} />,
          isCountry: true,
          countryKey: "bangladesh",
          subMenus: [
            {
              name: "Game Counts",
              path: "/admin/bangladesh/gamecounts",
              icon: <ListOrdered size={14} />,
            },
            {
              name: "Game Entries",
              path: "/admin/bangladesh/gameEntries",
              icon: <ZapIcon size={14} />,
            },
            {
              name: "Powerball Result",
              path: "/admin/bangladesh/powerball-result",
              icon: <Trophy size={14} />,
            },
            {
              name: "Powerball Divisions",
              path: "/admin/bangladesh/powerball-divisions",
              icon: <ListOrdered size={14} />,
            },
          ],
        },
        // ✅ India
        {
          name: "India",
          icon: <Flag size={16} />,
          isCountry: true,
          countryKey: "india",
          subMenus: [
            {
              name: "Game Counts",
              path: "/admin/india/gamecounts",
              icon: <ListOrdered size={14} />,
            },
            {
              name: "Game Entries",
              path: "/admin/india/gameEntries",
              icon: <ZapIcon size={14} />,
            },
            {
              name: "Powerball Result",
              path: "/admin/india/powerball-result",
              icon: <Trophy size={14} />,
            },
            {
              name: "Powerball Divisions",
              path: "/admin/india/powerball-divisions",
              icon: <ListOrdered size={14} />,
            },
          ],
        },
        // ✅ Nepal
        {
          name: "Nepal",
          icon: <Flag size={16} />,
          isCountry: true,
          countryKey: "nepal",
          subMenus: [
            {
              name: "Game Counts",
              path: "/admin/nepal/gamecounts",
              icon: <ListOrdered size={14} />,
            },
            {
              name: "Game Entries",
              path: "/admin/nepal/gameEntries",
              icon: <ZapIcon size={14} />,
            },
            {
              name: "Powerball Result",
              path: "/admin/nepal/powerball-result",
              icon: <Trophy size={14} />,
            },
            {
              name: "Powerball Divisions",
              path: "/admin/nepal/powerball-divisions",
              icon: <ListOrdered size={14} />,
            },
          ],
        },
        // ✅ UAE
        {
          name: "UAE",
          icon: <Flag size={16} />,
          isCountry: true,
          countryKey: "uae",
          subMenus: [
            {
              name: "Game Counts",
              path: "/admin/uae/gamecounts",
              icon: <ListOrdered size={14} />,
            },
            {
              name: "Game Entries",
              path: "/admin/uae/gameEntries",
              icon: <ZapIcon size={14} />,
            },
            {
              name: "Powerball Result",
              path: "/admin/uae/powerball-result",
              icon: <Trophy size={14} />,
            },
            {
              name: "Powerball Divisions",
              path: "/admin/uae/powerball-divisions",
              icon: <ListOrdered size={14} />,
            },
          ],
        },
      ],
    },

    {
      name: "Settings",
      icon: <Settings size={20} />,
      color: "gray",
      subMenus: [
        {
          name: "General Settings",
          path: "/admin/settings",
          icon: <UserCog size={16} />,
        },
        {
          name: "Deposit Settings",
          path: "/admin/deposit-settings",
          icon: <DollarSign size={16} />,
        },
        {
          name: "Withdrawal Settings",
          path: "/admin/withdrawal-settings",
          icon: <CreditCard size={16} />,
        },
        {
          name: "Security Settings",
          path: "/admin/security-settings",
          icon: <Shield size={16} />,
        },
        {
          name: "Ticket Settings",
          path: "/admin/ticketsetiings",
          icon: <Award size={16} />,
        },
        {
          name: "Referral Levels",
          path: "/admin/referral-levels",
          icon: <Network size={16} />,
        },
        {
          name: "Betting Bonus",
          path: "/admin/betting-bonus",
          icon: <Gift size={16} />,
        },
        // ❌ Win Multipliers removed from here
      ],
    },
  ];

  // Get color classes
  const getActiveColor = (color) => {
    const colors = {
      blue: "bg-blue-600",
      green: "bg-green-600",
      purple: "bg-purple-600",
      emerald: "bg-emerald-600",
      orange: "bg-orange-600",
      cyan: "bg-cyan-600",
      red: "bg-red-600",
      pink: "bg-pink-600",
      gray: "bg-gray-600",
      amber: "bg-amber-600",
      yellow: "bg-yellow-600",
    };
    return colors[color] || "bg-blue-600";
  };

  const getHoverColor = (color) => {
    const colors = {
      blue: "hover:bg-blue-600/20",
      green: "hover:bg-green-600/20",
      purple: "hover:bg-purple-600/20",
      emerald: "hover:bg-emerald-600/20",
      orange: "hover:bg-orange-600/20",
      cyan: "hover:bg-cyan-600/20",
      red: "hover:bg-red-600/20",
      pink: "hover:bg-pink-600/20",
      gray: "hover:bg-gray-600/20",
      amber: "hover:bg-amber-600/20",
      yellow: "hover:bg-yellow-600/20",
    };
    return colors[color] || "hover:bg-gray-600/20";
  };

  const getTextColor = (color) => {
    const colors = {
      blue: "text-blue-400",
      green: "text-green-400",
      purple: "text-purple-400",
      emerald: "text-emerald-400",
      orange: "text-orange-400",
      cyan: "text-cyan-400",
      red: "text-red-400",
      pink: "text-pink-400",
      gray: "text-gray-400",
      amber: "text-amber-400",
      yellow: "text-yellow-400",
    };
    return colors[color] || "text-gray-400";
  };

  const getBorderColor = (color) => {
    const colors = {
      blue: "border-blue-500",
      green: "border-green-500",
      purple: "border-purple-500",
      emerald: "border-emerald-500",
      orange: "border-orange-500",
      cyan: "border-cyan-500",
      red: "border-red-500",
      pink: "border-pink-500",
      gray: "border-gray-500",
      amber: "border-amber-500",
      yellow: "border-yellow-500",
    };
    return colors[color] || "border-blue-500";
  };

  // Recursive function to render submenus
  const renderSubMenus = (subMenus, parentKey = "") => {
    return subMenus.map((subMenu) => {
      if (subMenu.subMenus && subMenu.isCountry) {
        const isExpanded = expandedMenus[subMenu.countryKey];
        const isActive = subMenu.subMenus.some(sm => location.pathname === sm.path);
        
        return (
          <div key={subMenu.countryKey} className="ml-2">
            <button
              onClick={() => toggleMenu(subMenu.countryKey)}
              className={`
                flex items-center justify-between w-full px-4 py-2 
                text-gray-300 transition-all duration-200 text-sm rounded-lg
                hover:bg-gray-800/50 hover:text-white
                ${isExpanded || isActive ? 'bg-gray-800/30 text-white' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <span className={isExpanded || isActive ? 'text-yellow-400' : 'text-gray-400'}>
                  {subMenu.icon}
                </span>
                <span className="text-sm">{subMenu.name}</span>
              </div>
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
            </button>
            
            {(isExpanded || isActive) && (
              <div className="ml-4 border-l-2 border-gray-700/30">
                {subMenu.subMenus.map((child) => {
                  const isChildActive = location.pathname === child.path;
                  return (
                    <a
                      key={child.path}
                      href={child.path}
                      onClick={() => {
                        onClose();
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-2 transition-all duration-200 text-sm
                        ${isChildActive
                          ? "text-white bg-gradient-to-r from-yellow-600/20 to-yellow-600/10 border-r-2 border-yellow-500"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                        }
                      `}
                    >
                      <span className={isChildActive ? "text-yellow-400" : "text-gray-500"}>
                        {child.icon}
                      </span>
                      <span>{child.name}</span>
                      {isChildActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      
      // Regular submenu item
      const isActive = location.pathname === subMenu.path;
      const parentColor = parentKey === "powerhit" ? "yellow" : "amber";
      
      return (
        <a
          key={subMenu.path}
          href={subMenu.path}
          onClick={() => {
            onClose();
          }}
          className={`
            flex items-center gap-3 px-4 py-2 transition-all duration-200 text-sm
            ${isActive
              ? `text-white bg-gradient-to-r from-${parentColor}-600/20 to-${parentColor}-600/10 border-r-2 border-${parentColor}-500`
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
            }
          `}
        >
          <span className={isActive ? `text-${parentColor}-400` : "text-gray-500"}>
            {subMenu.icon}
          </span>
          <span>{subMenu.name}</span>
          {isActive && (
            <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-${parentColor}-500`}></span>
          )}
        </a>
      );
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 
          w-64 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
          text-white shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Decorative gradient line at top */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Control Dashboard
              </p>
            </div>
          </div>

          <button
            className="lg:hidden hover:bg-gray-700/50 p-2 rounded-xl transition-all duration-200"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Menus - SCROLL HIDDEN ✅ */}
        <div className="py-4 overflow-y-auto h-[calc(100vh-200px)] scrollbar-hide">
          {menus.map((menu) => {
            if (menu.subMenus) {
              const menuKey = menu.name.toLowerCase().replace(" ", "");
              const isExpanded = expandedMenus[menuKey];
              
              // Check if any submenu is active
              const isActive = menu.subMenus.some(sub => {
                if (sub.path) return location.pathname === sub.path;
                if (sub.subMenus) {
                  return sub.subMenus.some(child => location.pathname === child.path);
                }
                return false;
              });
              
              return (
                <div key={menu.name} className="mb-1">
                  <button
                    onClick={() => toggleMenu(menuKey)}
                    className={`
                      flex items-center justify-between w-full px-6 py-3 
                      text-gray-300 transition-all duration-200
                      hover:bg-gray-800/50 hover:text-white
                      ${isExpanded || isActive ? 'bg-gray-800/30 text-white' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isExpanded || isActive ? `text-${menu.color}-400` : 'text-gray-400'}>
                        {menu.icon}
                      </span>
                      <span className="text-sm font-medium">{menu.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                        {menu.subMenus.length}
                      </span>
                      {isExpanded || isActive ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {(isExpanded || isActive) && (
                    <div className="ml-4 border-l-2 border-gray-700/30 ml-6">
                      {renderSubMenus(menu.subMenus, menuKey)}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                onClick={() => {
                  onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 transition-all duration-200 mx-2 rounded-xl
                  ${isActive
                    ? `bg-gradient-to-r from-${menu.color}-600/20 to-${menu.color}-600/10 text-white border-r-2 border-${menu.color}-500`
                    : "text-gray-300 hover:bg-gray-800/30 hover:text-white"
                  }`
                }
              >
                <span className={`
                  ${location.pathname === menu.path ? getTextColor(menu.color) : 'text-gray-400'}
                `}>
                  {menu.icon}
                </span>
                <span className="text-sm font-medium">{menu.name}</span>
                {location.pathname === menu.path && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full ${menu.color === 'amber' ? 'bg-amber-500' : menu.color === 'yellow' ? 'bg-yellow-500' : `bg-${menu.color}-500`}`}></span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span>Online</span>
            </div>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors">
                <HelpCircle size={16} className="text-gray-400" />
              </button>
              <button className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors">
                <Bell size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-gray-500 text-center">
            v2.1.0 • Last updated: Today
          </div>
        </div>

        {/* ✅ CSS to hide scrollbar - Added directly in component */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </aside>
    </>
  );
};

export default Sidebar;