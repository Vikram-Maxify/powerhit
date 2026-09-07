import { useState, useRef, useEffect } from "react";
import logo from "../assets/universalImage/bynex logo 1.png";
import { BsGlobe } from "react-icons/bs";
import { RxCross1, RxHamburgerMenu } from "react-icons/rx";
import { MdAdd } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { FaCaretDown } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import { FiEye, FiLogOut } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { getUser, Logout } from "../Redux/Reducer/authReducer";
import { toast } from "react-toastify";
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import Menubar from "./Menubar";
import air from "../assets/universalImage/561ff9732b7ce13acc53.png";
import Cookies from "js-cookie";

const Header = () => {
  const { userInfo, errorMessage, successMessage, loading } = useSelector(
    (state) => state.auth || {}
  );

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpen2, setIsDropdownOpen2] = useState(false);
  const [activeAccount, setActiveAccount] = useState("demo");
  const [menuOpen, setMenuOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [Active, SetActive] = useState("");

  const dropdownRef = useRef(null);

  // --------------------------------------------------
  // SAFE USER VALUES
  // --------------------------------------------------

  const balance = Number(userInfo?.money ?? 0);

  const formattedBalance = balance.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const userEmail = userInfo?.email ?? "-";
  const userId = userInfo?.userId ?? "-";
  const currency = userInfo?.currency ?? "USD";

  // --------------------------------------------------
  // GET USER
  // --------------------------------------------------

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // --------------------------------------------------
  // ACTIVE / DEPOSIT STATUS
  // --------------------------------------------------

  useEffect(() => {
    SetActive(userInfo?.deposit ?? "");
  }, [userInfo]);

  // --------------------------------------------------
  // TOGGLE MOBILE MENU
  // --------------------------------------------------

  const toggleMobileMenu = () => {
    setMenuOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem("menuOpen", String(newValue));
      return newValue;
    });
  };

  // --------------------------------------------------
  // ACCOUNT DROPDOWN
  // --------------------------------------------------

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleDropdown2 = () => {
    setIsDropdownOpen2((prev) => !prev);
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    try {
      const res = await dispatch(Logout());

      if (res?.payload?.success) {
        localStorage.removeItem("token");

        toast.success(
          res?.payload?.message || "Logged out successfully"
        );

        dispatch(getUser());

        setIsDropdownOpen(false);
        setIsDropdownOpen2(false);

        navigate("/");
        window.location.reload();
      } else {
        toast.error(
          res?.payload?.message || "Logout failed"
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Something went wrong while logging out");
    }
  };

  // --------------------------------------------------
  // CLOSE DROPDOWN OUTSIDE CLICK
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --------------------------------------------------
  // NAV LINKS
  // --------------------------------------------------

  const navLinks = [
    {
      text: "Demo account",
      path: "/demo",
    },
    {
      text: "About us",
      path: "/about",
    },
    {
      text: "FAQ",
      path: "/faq",
    },
    {
      text: "Blog",
      path: "/blog",
    },
  ];

  // --------------------------------------------------
  // ACCOUNT CLICK
  // --------------------------------------------------

  const handleClick = () => {
    setIsDropdownOpen(false);
    setIsDropdownOpen2(false);
    navigate("/SideNavbar");
  };

  // --------------------------------------------------
  // TOKEN
  // --------------------------------------------------

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  // --------------------------------------------------
  // RETURN
  // --------------------------------------------------

  return (
    <header className="shadow-md w-full bg-[#1c1f2d] z-50">
      <div className="w-[99%] mx-auto flex justify-between items-center p-2 md:p-4">

        {/* =====================================================
            LOGO / DESKTOP LEFT
        ====================================================== */}

        <div className="hidden md:flex items-center gap-[50px]">

          {Active && (
            <div className="flex text-white text-4xl cursor-pointer">
              {menuOpen ? (
                <RxCross1 onClick={toggleMobileMenu} />
              ) : (
                <HiOutlineMenuAlt1 onClick={toggleMobileMenu} />
              )}
            </div>
          )}

          <Link
            to="/SideNavbar"
            className="hidden md:flex gap-[2.2rem]"
          >
            <img
              src={logo}
              alt="Bynexx Logo"
              className="h-8"
            />

            {Active && (
              <span className="text-[15px] font-bold text-gray-400 opacity-60 mt-2">
                WEB TRADING PLATFORM
              </span>
            )}
          </Link>
        </div>

        {/* =====================================================
            MOBILE HEADER
        ====================================================== */}

        <div className="block md:hidden">

          {isLoggedIn ? (
            <button
              onClick={toggleDropdown2}
              className="hover:bg-[#191919] bg-[#2b3040] text-white px-2 py-1 rounded font-semibold cursor-pointer md:hidden block"
            >
              <div className="flex items-center justify-between gap-1">

                <div className="flex items-center space-x-2">
                  <IoIosSend className="text-green-500 text-2xl" />
                </div>

                <div className="text-white flex items-center gap-2">

                  <div className="text-sm font-semibold text-[#7e828d]">
                    Live
                  </div>

                  <div className="text-xs">
                    {activeAccount === "live"
                      ? "$ 0.00"
                      : `$ ${formattedBalance}`}
                  </div>

                </div>

                <div
                  className={`transition-transform duration-300 ${
                    isDropdownOpen2
                      ? "rotate-180"
                      : "rotate-0"
                  }`}
                >
                  <FaCaretDown className="text-white text-xl" />
                </div>

              </div>
            </button>
          ) : (
            <img
              src={logo}
              alt="Bynexx Logo"
              className="h-8"
            />
          )}

          {/* =================================================
              MOBILE ACCOUNT DROPDOWN
          ================================================== */}

          {isDropdownOpen2 && (
            <div className="absolute left-0 top-7 mt-2 w-96 rounded shadow-lg z-[8888888888] flex p-2 text-sm">

              {/* LEFT PANEL */}
              <div className="w-2/3 p-4 bg-[#191919] rounded">

                <div className="flex justify-between items-center mb-4 gap-1">

                  <div className="flex items-center rounded-s-md bg-[#282a38] px-2 w-full">

                    <IoIosSend className="text-2xl mr-2 text-green-500" />

                    <div>
                      <div className="font-bold text-xs text-gray-400">
                        STANDARD:
                      </div>

                      <div className="text-white">
                        +0% profit
                      </div>
                    </div>

                  </div>

                  <button className="text-white hover:text-gray-300 rounded-e-md bg-[#282a38] p-3">
                    <FiEye className="w-4 h-4" />
                  </button>

                </div>

                <div className="mb-4">

                  <div className="text-white font-semibold text-sm">
                    {userEmail}
                  </div>

                  <span className="text-gray-500 font-semibold">
                    ID: {userId}
                  </span>

                </div>

                <div className="flex items-center gap-2 mb-4">

                  <div className="text-white font-bold">
                    Currency:
                  </div>

                  <div className="flex items-center">

                    <span className="font-medium mr-2 text-white">
                      {currency}
                    </span>

                    <button className="text-black bg-white px-3 rounded hover:bg-gray-200 font-semibold text-sm">
                      Change
                    </button>

                  </div>

                </div>

                <div className="space-y-3">

                  {/* LIVE ACCOUNT */}

                  <div
                    className={`flex items-center p-2 rounded cursor-pointer ${
                      activeAccount === "live"
                        ? "bg-blue-900/30"
                        : ""
                    }`}
                    onClick={handleClick}
                  >

                    <div
                      className={`w-5 h-5 border-2 rounded-full mr-3 ${
                        activeAccount === "live"
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {activeAccount === "live" && (
                        <div className="w-4 h-4 rounded-full bg-white mx-auto my-auto" />
                      )}
                    </div>

                    <div>

                      <div className="text-white font-medium">
                        Live Account
                      </div>

                      <div className="text-white">
                        $ {formattedBalance}
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}

        <nav className="hidden md:flex space-x-6">
          <ul className="flex space-x-6">
            {/* Navigation links intentionally disabled */}
          </ul>
        </nav>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        {!Active ? (
          <div className="flex items-center gap-3">

            {/* Language Selector intentionally disabled */}

          </div>
        ) : (
          <div>

            {/* MOBILE DEPOSIT */}

            <div className="md:hidden">
              <Link
                to="/Deposite?trading=Deposit"
                className="block text-white hover:text-gray-300 p-1.5 hover:bg-gray-700 rounded bg-green-500 font-semibold px-4 text-sm"
              >
                Deposit
              </Link>
            </div>

            {/* DESKTOP RIGHT */}

            <div className="hidden md:flex items-center space-x-4">

              {/* =================================================
                  ACCOUNT DROPDOWN
              ================================================== */}

              <div
                className="relative"
                ref={dropdownRef}
              >

                <button
                  onClick={toggleDropdown}
                  className="hover:bg-[#191919] bg-[#2b3040] text-white px-2 py-1 rounded font-semibold cursor-pointer"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center space-x-2">
                      <IoIosSend className="text-green-500 text-2xl" />
                    </div>

                    <div className="text-white">

                      <div className="text-sm font-semibold text-[#7e828d]">
                        Live Account
                      </div>

                      <div className="text-xs">
                        {activeAccount === "live"
                          ? "$ 0.00"
                          : `$ ${formattedBalance}`}
                      </div>

                    </div>

                    <div
                      className={`transition-transform duration-300 ${
                        isDropdownOpen
                          ? "rotate-180"
                          : "rotate-0"
                      }`}
                    >
                      <FaCaretDown className="text-white text-xl" />
                    </div>

                  </div>

                </button>

                {/* =================================================
                    DESKTOP DROPDOWN CONTENT
                ================================================== */}

                {isDropdownOpen && (
                  <div className="absolute right-0 top-0 mt-2 w-96 bg-[#191919] rounded shadow-lg z-[8888888888] flex p-2">

                    {/* LEFT PANEL */}

                    <div className="w-2/3 p-4 bg-[#1c1f2d] rounded">

                      <div className="flex justify-between items-center mb-4 gap-1">

                        <div className="flex items-center rounded-s-md bg-[#282a38] px-2 w-full">

                          <IoIosSend className="text-2xl mr-2 text-green-500" />

                          <div>

                            <div className="font-bold text-xs text-gray-400">
                              STANDARD:
                            </div>

                            <div className="text-white">
                              +0% profit
                            </div>

                          </div>

                        </div>

                        <button className="text-white hover:text-gray-300 rounded-e-md bg-[#282a38] p-3">
                          <FiEye className="w-4 h-4" />
                        </button>

                      </div>

                      <div className="mb-4">

                        <div className="text-white font-semibold text-sm">
                          {userEmail}
                        </div>

                        <span className="text-gray-500 font-semibold">
                          ID: {userId}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 mb-4">

                        <div className="text-white font-bold">
                          Currency:
                        </div>

                        <div className="flex items-center">

                          <span className="font-medium mr-2 text-white">
                            {currency}
                          </span>

                          <button className="text-black bg-white px-3 rounded hover:bg-gray-200 font-semibold text-sm">
                            Change
                          </button>

                        </div>

                      </div>

                      <div className="space-y-3">

                        {/* LIVE ACCOUNT */}

                        <div
                          className={`flex items-center p-2 rounded cursor-pointer ${
                            activeAccount === "live"
                              ? "bg-blue-900/30"
                              : ""
                          }`}
                          onClick={handleClick}
                        >

                          <div
                            className={`w-5 h-5 border-2 rounded-full mr-3 ${
                              activeAccount === "live"
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            }`}
                          >

                            {activeAccount === "live" && (
                              <div className="w-4 h-4 rounded-full bg-white mx-auto my-auto" />
                            )}

                          </div>

                          <div>

                            <div className="text-white font-medium">
                              Live Account
                            </div>

                            <div className="text-white">
                              $ {formattedBalance}
                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* =================================================
                        RIGHT PANEL
                    ================================================== */}

                    <div className="w-1/3 bg-[#191919] rounded-r-md p-2">

                      <ul className="space-y-3">

                        <li
                          onClick={() =>
                            setIsDropdownOpen(false)
                          }
                        >
                          <Link
                            to="/Deposite?trading=Deposit"
                            className="block text-white hover:text-gray-300 p-2 hover:bg-gray-700 rounded"
                          >
                            Deposit
                          </Link>
                        </li>

                        <li
                          onClick={() =>
                            setIsDropdownOpen(false)
                          }
                        >
                          <Link
                            to="/Deposite?trading=Withdrawal"
                            className="block text-white hover:text-gray-300 p-2 hover:bg-gray-700 rounded"
                          >
                            Withdrawal
                          </Link>
                        </li>

                        <li
                          onClick={() =>
                            setIsDropdownOpen(false)
                          }
                        >
                          <Link
                            to="/Deposite?trading=Transactions"
                            className="block text-white hover:text-gray-300 p-2 hover:bg-gray-700 rounded"
                          >
                            Transactions
                          </Link>
                        </li>

                        <li
                          onClick={() =>
                            setIsDropdownOpen(false)
                          }
                        >
                          <Link
                            to="/Deposite?trading=Trades"
                            className="block text-white hover:text-gray-300 p-2 hover:bg-gray-700 rounded"
                          >
                            Trades
                          </Link>
                        </li>

                        <li
                          onClick={() =>
                            setIsDropdownOpen(false)
                          }
                        >
                          <Link
                            to="/Deposite?trading=Account"
                            className="block text-white hover:text-gray-300 p-2 hover:bg-gray-700 rounded"
                          >
                            Account
                          </Link>
                        </li>

                        <li className="border-t border-gray-700 pt-3">

                          <button
                            onClick={handleLogout}
                            className="flex items-center text-red-500 hover:text-red-400 w-full p-2"
                          >
                            <FiLogOut className="mr-2" />
                            <span>Logout</span>
                          </button>

                        </li>

                      </ul>

                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  DEPOSIT / WITHDRAWAL
              ================================================== */}

              <div className="flex items-center gap-3">

                <Link
                  to="/Deposite?trading=Deposit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
                >
                  <MdAdd className="text-xl" />
                  Deposit
                </Link>

                <Link
                  to="/Deposite?trading=Withdrawal"
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white font-semibold"
                >
                  Withdrawal
                </Link>

              </div>

            </div>
          </div>
        )}

        {/* =====================================================
            MOBILE MENU BUTTON
        ====================================================== */}

        {/* <button
          className="md:hidden text-white text-2xl bg-[#58585b] p-2 rounded"
          onClick={toggleMobileMenu}
        >
          <RxHamburgerMenu />
        </button> */}

      </div>

      {/* =====================================================
          MOBILE MENU
      ====================================================== */}

      {isMobileMenuOpen && (
        <div className="absolute md:hidden bg-[#272938] shadow-lg z-50 w-full mx-auto">

          <div className="container mx-auto p-4">

            <div className="flex flex-col space-y-4">

              {navLinks.map((link) => (
                <Link
                  key={link.text}
                  to={link.path}
                  className="text-white hover:text-blue-400"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                >
                  {link.text}
                </Link>
              ))}

            </div>

            <div className="mt-6 flex flex-col space-y-4">

              <Link
                to="/"
                className="text-white hover:text-blue-400"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Log in
              </Link>

              <Link
                to="/"
                className="bg-[#026fd3] text-white px-4 py-2 rounded hover:bg-[#026fd3] text-center"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Sign up
              </Link>

            </div>

            <div className="mt-6 flex justify-between">

              <Link
                to="/Deposite?trading=Deposit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                <MdAdd className="text-xl" />
                Deposit
              </Link>

              <Link
                to="/Deposite?trading=Withdrawal"
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white font-semibold"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Withdrawal
              </Link>

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          SIDE MENUBAR
      ====================================================== */}

      {menuOpen && (
        <div className="absolute bg-[#272938b7] shadow-lg z-50 w-full mx-auto">

          <Menubar
            closeMenu={() => setMenuOpen(false)}
          />

        </div>
      )}

      {/* =====================================================
          BONUS BANNER
      ====================================================== */}

      {Number(Active) <= 0 && (
        <div className="bg-disc rounded-full absolute top-3 left-1/2 -translate-x-1/2 hidden md:block">

          <Link
            to="/Deposite?trading=Deposit"
            className="flex justify-between items-center gap-2 text-white font-semibold p-2 px-4"
          >

            <img
              src={air}
              alt="air"
              className="h-8 w-auto"
            />

            <p>
              Get a 30% bonus on your first deposit
            </p>

            <p className="bg-gray-600 rounded-full text-white text-sm p-2">
              30%
            </p>

          </Link>

        </div>
      )}

    </header>
  );
};

export default Header;
