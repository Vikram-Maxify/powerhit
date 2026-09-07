
import { useState } from "react"
import { FaImage, FaQuestionCircle, FaUser, FaTrophy, FaEllipsisH } from "react-icons/fa"
import { Link, useNavigate } from "react-router"
import { FaChartArea } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import { FaWallet } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { getUser, Logout } from "../Redux/Reducer/authReducer";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { RxCross1 } from "react-icons/rx";
import Top from "./top";

export default function MobileFooter() {
  const [activeMenu, setActiveMenu] = useState(false)
  const [top, setTop] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const navItems = [
    { id: "gallery", icon: FaChartArea, label: "Gallery", href: "/SideNavbar" },
    { id: "help", icon: FaQuestionCircle, label: "Help", href: "/support" },
    { id: "user", icon: FaUser, label: "Profile", href: "/Deposite?trading=Account" },
    { id: "trophy", icon: FaHistory, label: "History", href: "/Deposite?trading=Trades", notifications: 4 },
    // { id: "more", icon: FaWallet, label: "More", href: "/Deposite?trading=Withdrawal" },
  ]

  const handleLogout = () => {
    dispatch(Logout()).then((res) => {
      if (res?.payload?.success) {
        setActiveMenu(false);
        localStorage.removeItem("token");
        toast.success(res.payload.message);
        dispatch(getUser());
        window.location.reload();
        navigate("/");
      } else {
        toast.error(res.payload.message);
      }
    });
  };

  const handlenavigate = (path) => {
    setActiveMenu(false);
    navigate(path);
  }
  return (
    <>
    <footer className="fixed bottom-0 left-0 right-0 bg-[#1a1c25] h-14 flex items-center justify-around px-2 z-50 lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon

        return (
          <>
          <span
            key={item.id}
            onClick={() => handlenavigate(item.href)}
            className="relative flex flex-col items-center justify-center"
          >
            <Icon className={`h-6 w-6  text-white`} />
            <span className="sr-only">{item.label}</span>
          </span>
          </>
        )
      })}
      <span
      onClick={() => setActiveMenu(!activeMenu)}
            className="relative flex flex-col items-center justify-center"
          >
            <BsThreeDots className={`h-6 w-6  text-white`} />
            <span className="sr-only">More</span>
          </span>
    </footer>
        <div  className={`fixed bg-[#1c1f2d] z-20 top-0 h-[100vh] transform w-full ${activeMenu ? 'translate-x-[0%]' : '-translate-x-[100%]'} transition-transform duration-300`} >
      <div className="flex flex-col h-[90vh] w-full ">
        {/* <nav className="flex flex-col items-center space-y-2 p-4">
          <div>
            <Link
              to="/SideNavbar"
              onClick={() => setActiveMenu(false)}
            >
              <div className="flex flex-col items-center justify-center font-semibold text-xs gap-1">
                <FaChartArea className="text-[20px]" />
                <span>TRADE</span>
              </div>
            </Link>
          </div>
          <Link
            to="/Deposite?trading=Account"
            onClick={() => setActiveMenu(false)}
            className="flex flex-col items-center justify-center font-semibold text-xs gap-1 text-white"
          >
            <div className="flex flex-col items-center justify-center font-semibold text-xs gap-1">
              <FaUser className="text-[20px]" />
              <span>ACCOUNT</span>
            </div>
          </Link>
        </nav> */}
        <h2 className="text-3xl font-semibold text-white p-4">More</h2>
        <div className="px-2">
          <ul className="space-y-2">
            <li className="p-3 bg-[#272938] rounded-md">
              <span
                onClick={() => setTop(true) }
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-white"
              >
              Top
              </span>
            </li>
            <li className="p-3 bg-[#272938] rounded-md">
              <Link
              to="/Deposite?trading=Deposit"
                onClick={() => setActiveMenu(false)}
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-white"
              >
                Deposit
              </Link>
            </li>
            <li className="p-3 bg-[#272938] rounded-md">
              <Link
                to="/Deposite?trading=Withdrawal"
                onClick={() => setActiveMenu(false)}
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-white"
              >
                Withdrawal
              </Link>
            </li>
            <li className="p-3 bg-[#272938] rounded-md">
              <Link
                to="/Deposite?trading=Transactions"
                onClick={() => setActiveMenu(false)}
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-white"
              >
                Transactions
              </Link>
            </li>
            <li className="p-3 bg-[#272938] rounded-md">
              <Link
                to="/Deposite?trading=Trades"
                onClick={() => setActiveMenu(false)}
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-white"
              >
                Trades
              </Link>
            </li>
            <li className="p-3 bg-[#272938] rounded-md">
              <Link
                to="/Deposite?trading=Account"
                onClick={() => setActiveMenu(false)}
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-white"
              >
                Account
              </Link>
            </li>
            <li className="p-3 bg-[#272938] rounded-md">
              <span
                onClick={handleLogout}
                className="flex flex-col items-center justify-center font-semibold text-base gap-1 text-red-500"
              >
                Logout
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    {
      top && (
        <div className="fixed top-0 w-full z-50">
        <div onClick={() => setTop(false)} className="cursor-pointer absolute right-3 top-4 text-white text-2xl"><RxCross1 /></div>
        <Top />
        </div>
      )
    }
    </>
  )
}
