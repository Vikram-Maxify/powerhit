import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  IoIosArrowBack,
  IoIosArrowDropright,
  IoIosArrowForward,
} from "react-icons/io";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { FaCircle, FaMinus, FaPlus } from "react-icons/fa";
import { PiCopySimpleBold } from "react-icons/pi";
import { IoCloseCircleOutline } from "react-icons/io5";
import debounce from "lodash/debounce";
import io from "socket.io-client";

import "./wingo.css";
import CopyCopmponent from "../../components/CopyCopmponent.jsx";
import EmptyData from "../../components/EmptyData.jsx";
import { host } from "../../redux/Slices/api.js";

// Assets
import TimeImg from "../../assets/time.png";
import TimeActiveImg from "../../assets/time_aactive.png";
import ZeroImg from "../../assets/zero.png";
import OneImg from "../../assets/one.png";
import TwoImg from "../../assets/two.png";
import ThreeImg from "../../assets/three.png";
import FourImg from "../../assets/four.png";
import FiveImg from "../../assets/five.png";
import SixImg from "../../assets/six.png";
import SevenImg from "../../assets/seven.png";
import EightImg from "../../assets/eight.png";
import NineImg from "../../assets/nine.png";
import Audio1 from "../../assets/audio/di1.mp3";
import Audio2 from "../../assets/audio/di2.mp3";

// Constants
const WinImg = "https://i.ibb.co/ssJ2HLw/win-popup.png";
const LoseImg = "https://i.ibb.co/8zTQQmx/loss-popup.png";

const ImgData = [
  ZeroImg, OneImg, TwoImg, ThreeImg, FourImg,
  FiveImg, SixImg, SevenImg, EightImg, NineImg,
];

const X_DATA = [1, 5, 10, 20, 50, 100];
const BALANCE_OPTIONS = [1, 10, 100, 1000];
const TIME_OPTIONS = [
  { value: 10, label: "30s", game: "wingo10" },
  { value: 1, label: "1Min", game: "wingo" },
  { value: 3, label: "3Min", game: "wingo3" },
  { value: 5, label: "5Min", game: "wingo5" },
];

const socket = io(host);

// ============================================================
// MAIN COMPONENT
// ============================================================
const Wingo = () => {
  // ---- State ----
  const [userInfo, setUserInfo] = useState(null);
  const [wingoPeriodListData, setWingoPeriodListData] = useState(null);
  const [wingoHistoryData, setWingoHistoryData] = useState(null);
  const [loader, setLoader] = useState(false);
  const [messages, setMessage] = useState("");
  const [activeTime, setActiveTime] = useState(10);
  const [activeX, setActiveX] = useState(0);
  const [gameHistory, setGameHistory] = useState("ghistory");
  const [openPopup, setOpenPopup] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const [openHowtoPlay, setHowtoPlay] = useState(false);
  const [details, setDetails] = useState(null);
  const [refershPopup, setRefeshPopup] = useState(false);
  const [pageno, setPage] = useState(1);
  const [pageto, setPageto] = useState(10);
  const [typeid1, setTypeid1] = useState(10);
  const [minutetime1, setMinutetime1] = useState(0);
  const [minutetime2, setMinutetime2] = useState(0);
  const [secondtime1, setSecondtime1] = useState(0);
  const [secondtime2, setSecondtime2] = useState(0);
  const [betAlert, setBetAlert] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [activeVoice, setActiveVoice] = useState(true);
  const [winResult, setWinResult] = useState(null);
  const [resultPopup, setResultPopup] = useState(false);
  const [copyPopup, setCopyPopup] = useState(false);
  const [selectBet, setSelectBet] = useState("");
  const [animate, setAnimate] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [balance, setBalance] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const [numbers, setNumbers] = useState([4, 16, 3, 14, 18, 18, 1, 9, 7, 22]);
  const [number2, setNumber2] = useState([4, 1, 9, 14, 18, 11, 10, 9, 12, 22]);
  const [number3, setNumber3] = useState([4, 16, 3, 14, 18, 18, 1, 9, 7, 22]);
  const [number4, setNumber4] = useState([4, 16, 3, 14, 18, 18, 1, 9, 7, 22]);

  // ---- Refs ----
  const intervalRef = useRef(null);
  const calledRef = useRef(false);
  const isConnectedRef = useRef(false);
  const audio1Ref = useRef(new Audio(Audio1));
  const audio2Ref = useRef(new Audio(Audio2));

  // ---- Router ----
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const Game = queryParams.get("Game");

  // ---- Derived ----
  const totalAmount = balance * multiplier;

  // ---- Mock APIs (replace with real calls) ----
  const mockUserDetail = async () => ({ status: true, data: { money_user: 1000 } });
  const mockWingoPeriodList = async (params) => ({
    status: true,
    data: {
      gameslist: [
        { period: "2026-01-01", amount: 5 },
        { period: "2026-01-02", amount: 3 },
        { period: "2026-01-03", amount: 7 },
        { period: "2026-01-04", amount: 1 },
        { period: "2026-01-05", amount: 9 },
      ],
      page: 5,
    },
    period: "2026-01-01",
  });
  const mockWingoHistory = async (params) => ({
    status: true,
    data: {
      gameslist: [
        { bet: "x", stage: "2026-01-01", today: "2026-01-01", status: 1, get: 200, money: 100, fee: 2, amount: 5, id_product: "12345", result: 5 },
        { bet: "d", stage: "2026-01-02", today: "2026-01-02", status: 2, get: 0, money: 100, fee: 2, amount: 5, id_product: "12346", result: 2 },
      ],
      page: 5,
    },
    page: 5,
  });
  const mockWingoBet = async (params) => ({ status: true, message: "Bet placed successfully" });

  // ============================================================
  // HELPERS
  // ============================================================
  const getRandomNumbers = (length, max) =>
    Array.from({ length }, () => Math.floor(Math.random() * max) + 1);

  const getColorClass = (value, type = "bg") => {
    const map = {
      0: `${type}-red-voilet`,
      5: `${type}-green-voilet`,
    };
    if (map[value]) return map[value];
    const isGreen = [1, 3, 7, 9].includes(value);
    return isGreen ? `${type}-green` : `${type}-red-200`;
  };

  const getBetLabel = (bet) => {
    const map = { x: "Green", d: "Red", t: "Violet", l: "Big", n: "Small" };
    return map[bet] || bet;
  };

  const getBetClass = (bet) => {
    const map = {
      x: "bgs-green",
      d: "bgs-red-200",
      t: "bgs-violet",
      l: "color-yellow-bg-200",
      n: "bgs-blue-500",
    };
    if (map[bet]) return map[bet];
    const num = Number(bet);
    if ([1, 3, 7, 9].includes(num)) return "bgs-green";
    if (num === 5) return "bg-green-voilet";
    if (num === 0) return "bg-red-voilet";
    return "bgs-red-200";
  };

  const getHowToPlayContent = () => {
    const base = (period, total) => (
      <>
        <p className="font-bold text-white">
          {period} 1 issue, {period === "30 seconds" ? "25" : String(parseInt(period) * 60 - 15)} seconds to order,
          15 seconds waiting for the draw. It opens all day. Total {total} issues.
        </p>
        <p className="font-bold mt-2 text-white/80">
          If you spend 100 to trade, after deducting 2 service fee, your contract amount is 98:
        </p>
        <ul className="list-disc pl-4 space-y-1 text-white/70">
          <li><span className="text-green-400">Green</span>: 1,3,7,9 → (98×2)=196; 5 → (98×1.5)=147</li>
          <li><span className="text-red-400">Red</span>: 2,4,6,8 → (98×2)=196; 0 → (98×1.5)=147</li>
          <li><span className="text-purple-400">Violet</span>: 0 or 5 → (98×4.5)=441</li>
          <li><span className="text-blue-400">Number</span>: match → (98×9)=882</li>
          <li><span className="text-yellow-400">Big</span>: 5-9 → (98×2)=196</li>
          <li><span className="text-cyan-400">Small</span>: 0-4 → (98×2)=196</li>
        </ul>
      </>
    );
    const map = {
      10: base("30 seconds", 2880),
      1: base("1 Minute", 1440),
      3: base("3 Minutes", 480),
      5: base("5 Minutes", 288),
    };
    return map[activeTime] || map[10];
  };

  // ============================================================
  // FUNCTIONS (defined before useEffect hooks)
  // ============================================================
  
  const openAudio = () => {
    audio1Ref.current.muted = true;
    audio2Ref.current.muted = true;
    audio1Ref.current.play().catch(() => {});
    audio2Ref.current.play().catch(() => {});
  };

  const playAudio = (ref) => {
    ref.current.muted = false;
    ref.current.play().catch(() => {});
  };

  const updateNumbers = () => {
    const newNumbers = getRandomNumbers(10, 30);
    setNumbers(newNumbers);
    const newNumbers2 = getRandomNumbers(10, 20);
    setNumber2(newNumbers2);
    const newNumbers3 = getRandomNumbers(10, 25);
    setNumber3(newNumbers3);
    const newNumbers4 = getRandomNumbers(10, 29);
    setNumber4(newNumbers4);
  };

  const chartFunction = () => {
    const trendList = document.getElementById("trendList");
    if (!trendList) return;

    const existingSvg = document.querySelector(".svg-line");
    if (existingSvg) existingSvg.remove();

    const activeElements = document.querySelectorAll(".container2 .active");
    if (activeElements.length < 2) return;

    const svgns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgns, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("class", "svg-line");

    for (let i = 0; i < activeElements.length - 1; i++) {
      const first = activeElements[i];
      const second = activeElements[i + 1];
      const line = document.createElementNS(svgns, "line");
      line.setAttribute("x1", `${first.offsetLeft + first.offsetWidth / 2}px`);
      line.setAttribute("y1", `${first.offsetTop + first.offsetHeight / 2}px`);
      line.setAttribute("x2", `${second.offsetLeft + second.offsetWidth / 2}px`);
      line.setAttribute("y2", `${second.offsetTop + second.offsetHeight / 2}px`);
      line.setAttribute("stroke", "red");
      line.setAttribute("stroke-width", "0.6");
      svg.appendChild(line);
    }
    trendList.style.position = "relative";
    trendList.appendChild(svg);
  };

  const fetchHistory = async () => {
    const res = await mockWingoHistory({ typeid1, pageno, pageto });
    setWingoHistoryData(res);
    setHistoryPage(res?.page);
  };

  const fetchNewData = async (pageno, pageto) => {
    const res = await mockWingoPeriodList({ typeid1, pageno, pageto });
    if (res.status) {
      setWingoPeriodListData(res);
      setTimeout(chartFunction, 100);
    }
    await fetchHistory();
  };

  // ---- Debounced Functions (defined before useEffect that uses them) ----
  const debouncedFetch = useCallback(
    debounce(async (typeid1, pageno, pageto) => {
      const res = await mockWingoPeriodList({ typeid1, pageno, pageto });
      if (res.status) {
        setWingoPeriodListData(res);
        setTimeout(chartFunction, 100);
      }
      const historyRes = await mockWingoHistory({ typeid1, pageno, pageto });
      setWingoHistoryData(historyRes);
      setHistoryPage(historyRes?.page);
      updateNumbers();
    }, 500),
    []
  );

  const debouncedFetchResult = useCallback(
    debounce(async (typeid1, pageno, pageto) => {
      const res = await mockWingoHistory({ typeid1, pageno, pageto });
      setWingoHistoryData(res);
      setHistoryPage(res?.page);
      if (res?.data?.gameslist?.[0]?.status === 1) {
        const userRes = await mockUserDetail();
        setUserInfo(userRes.data);
        setWinResult(true);
      } else if (res?.data?.gameslist?.[0]?.status === 2) {
        setWinResult(false);
      }
    }, 500),
    []
  );

  // ---- Socket Listeners ----
  const setSocketListeners = (typeid) => {
    const eventMap = { 5: "timeUpdate_5", 3: "timeUpdate_3", 1: "timeUpdate_11", 10: "timeUpdate_30" };
    const eventName = eventMap[typeid];
    if (!eventName) return;

    socket.off();
    socket.on(eventName, (data) => {
      if (!data) return;
      const { minute, secondtime1, secondtime2 } = data;
      setMinutetime2(minute);
      setSecondtime1(secondtime1);
      setSecondtime2(secondtime2);

      if (minute === 0 && secondtime1 === 0 && secondtime2 <= 5 && secondtime2 >= 1) {
        setOpenTime(true);
        setOpenPopup(false);
        if (activeVoice) playAudio(audio1Ref);
      } else {
        setOpenTime(false);
      }

      const triggerMap = {
        5: minute === 4 && secondtime1 === 5 && secondtime2 === 9,
        3: minute === 2 && secondtime1 === 5 && secondtime2 === 9,
        1: minute === 0 && secondtime1 === 5 && secondtime2 === 9,
        10: minute === 0 && secondtime1 === 5 && secondtime2 === 9,
      };
      if (triggerMap[typeid] && activeVoice) playAudio(audio2Ref);
    });
  };

  // ---- Event Handlers ----
  const handleWingoMinut = (data) => {
    setActiveTime(data);
    localStorage.setItem("wingominute", data);
    setTypeid1(data);
    setPage(1);
    setPageto(10);
    debouncedFetch(data, 1, 10);
    navigate(`/wingo?Game=${data}`);
  };

  const handleVoice = () => {
    const newState = !activeVoice;
    setActiveVoice(newState);
    localStorage.setItem("voice", newState);
  };

  const handleDetail = (i) => setDetails(details === i ? null : i);

  const handleRefersh = async () => {
    const res = await mockUserDetail();
    if (res.status) {
      setRefeshPopup(true);
      setUserInfo(res.data);
      setTimeout(() => setRefeshPopup(false), 2000);
    }
  };

  const handleIncrease = async () => {
    const newPage = pageno + 10;
    const newPageTo = pageto + 10;
    setPage(newPage);
    setPageto(newPageTo);
    await fetchNewData(newPage, newPageTo);
  };

  const handleDecrease = async () => {
    if (pageno >= 10) {
      const newPage = pageno - 10;
      const newPageTo = pageto - 10;
      setPage(newPage);
      setPageto(newPageTo);
      await fetchNewData(newPage, newPageTo);
    }
  };

  const handleBet = async () => {
    setLoader(true);
    const res = await mockWingoBet({ typeid1, selectBet, balance, multiplier });
    setBetAlert(true);
    setOpenPopup(false);
    setMessage(res.message);
    setBalance(1);
    setMultiplier(1);
    setActiveX(0);
    localStorage.setItem("bet", true);
    setTimeout(() => setMessage(""), 3000);
    if (res.status) await fetchHistory();
    setLoader(false);
  };

  const selectBetHandle = (data) => {
    setSelectBet(data);
    setTimeout(() => setOpenPopup(true), 100);
  };

  const generateRandomNumber = () => {
    const number = Math.floor(Math.random() * 10);
    setTimeout(() => selectBetHandle(number), 5000);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 5000);
  };

  const copyToClipboard = (number) => {
    navigator.clipboard.writeText(String(number))
      .then(() => {
        setCopyPopup(true);
        setTimeout(() => setCopyPopup(false), 1500);
      })
      .catch(console.error);
  };

  const handleClose = () => {
    setWinResult(null);
    setResultPopup(false);
  };

  // ============================================================
  // EFFECTS (all useCallback functions are now defined above)
  // ============================================================
  
  useEffect(() => {
    const voiceState = localStorage.getItem("voice");
    if (voiceState !== null) setActiveVoice(JSON.parse(voiceState));
    setActiveTime(Number(Game) || 10);
    setTypeid1(Number(Game) || 10);
    document.body.style.overflow = openPopup ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [Game, openPopup]);

  useEffect(() => {
    debouncedFetch(typeid1, pageno, pageto);
    fetchHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeid1 !== null) {
      updateNumbers();
      openAudio();
    }
  }, [typeid1]);

  useEffect(() => {
    if (typeid1 !== null) {
      setTimeout(chartFunction, 100);
    }
  }, [gameHistory, openTime, wingoPeriodListData]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Socket connection
  useEffect(() => {
    if (!isConnectedRef.current) {
      socket.connect();
      isConnectedRef.current = true;
    }
    setSocketListeners(typeid1);
    return () => { socket.off(); };
  }, [typeid1, activeVoice]);

  useEffect(() => {
    return () => {
      socket.disconnect();
      isConnectedRef.current = false;
    };
  }, []);

  // Socket messages handler
  useEffect(() => {
    const handler = async (msg) => {
      setPage(1);
      setPageto(10);

      const isWingo = (game) => {
        const map = { 1: "wingo", 3: "wingo3", 5: "wingo5", 10: "wingo10" };
        return msg?.data?.[0]?.game === map[typeid1];
      };

      if (isWingo(typeid1) && !calledRef.current) {
        calledRef.current = true;
        await debouncedFetch(typeid1, pageno, pageto);
        setTimeout(() => { calledRef.current = false; }, 2000);
      }

      if (msg?.data?.[1]?.period === wingoHistoryData?.gameslist?.[0]?.stage && !calledRef.current) {
        await debouncedFetchResult(typeid1, pageno, pageto);
        setResultPopup(true);
        setTimeout(() => { calledRef.current = false; }, 2000);
      }
    };

    socket.on("data-server", handler);
    return () => socket.off("data-server", handler);
  }, [typeid1, pageno, pageto, betAlert, messages, wingoHistoryData, debouncedFetch, debouncedFetchResult]);

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderTimeTabs = () => (
    <div className="grid grid-cols-4 gap-2 bg-popup-nav rounded-xl p-1">
      {TIME_OPTIONS.map(({ value, label }) => (
        <div
          key={value}
          className={`cursor-pointer flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 ${
            activeTime === value ? "blue-linear2 shadow-lg scale-105" : "hover:bg-white/10"
          }`}
          onClick={() => handleWingoMinut(value)}
        >
          <img
            src={activeTime === value ? TimeActiveImg : TimeImg}
            alt={label}
            className={`w-10 transition-all ${activeTime === value ? "hue-rotate-45 scale-110" : ""}`}
          />
          <p className={`text-center text-xs font-sans leading-4 mt-1 ${activeTime === value ? "text-black font-bold" : "gray-text"}`}>
            Win Go <br /> {label}
          </p>
        </div>
      ))}
    </div>
  );

  const renderPeriodSection = () => (
    <div className="wingo-period-bg flex justify-between items-center mt-4 rounded-xl p-3 shadow-lg">
      <div>
        <button
          className="border border-black/30 flex items-center justify-center text-black rounded-full px-4 py-1 text-sm hover:bg-black/5 transition bg-white/20"
          onClick={() => setHowtoPlay(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 36 36" fill="currentColor">
            <path d="M23.67 3H12.33C6.66 3 5.25 4.515 5.25 10.56V27.45C5.25 31.44 7.44 32.385 10.095 29.535L10.11 29.52C11.34 28.215 13.215 28.32 14.28 29.745L15.795 31.77C17.01 33.375 18.975 33.375 20.19 31.77L21.705 29.745C22.785 28.305 24.66 28.2 25.89 29.52C28.56 32.37 30.735 31.425 30.735 27.435V10.56C30.75 4.515 29.34 3 23.67 3ZM11.67 18C10.845 18 10.17 17.325 10.17 16.5C10.17 15.675 10.845 15 11.67 15C12.495 15 13.17 15.675 13.17 16.5C13.17 17.325 12.495 18 11.67 18ZM11.67 12C10.845 12 10.17 11.325 10.17 10.5C10.17 9.675 10.845 9 11.67 9C12.495 9 13.17 9.675 13.17 10.5C13.17 11.325 12.495 12 11.67 12ZM24.345 17.625H16.095C15.48 17.625 14.97 17.115 14.97 16.5C14.97 15.885 15.48 15.375 16.095 15.375H24.345C24.96 15.375 25.47 15.885 25.47 16.5C25.47 17.115 24.96 17.625 24.345 17.625ZM24.345 11.625H16.095C15.48 11.625 14.97 11.115 14.97 10.5C14.97 9.885 15.48 9.375 16.095 9.375H24.345C24.96 9.375 25.47 9.885 25.47 10.5C25.47 11.115 24.96 11.625 24.345 11.625Z" />
          </svg>
          <span className="text-sm font-medium">How to play</span>
        </button>
        <p className="text-sm ms-1 mb-2 mt-1 text-black font-bold">
          Win Go {activeTime === 10 ? "30s" : activeTime + "Min"}
        </p>
        <div className="flex items-center gap-1">
          {wingoPeriodListData?.data?.gameslist?.slice(0, 5).map((item, i) => (
            <img key={i} src={ImgData[item.amount]} alt="" className="w-7 rounded-full shadow-sm border-2 border-white/20" />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <p className="text-sm font-bold text-black">⏳ Time remaining</p>
        <div className="flex items-center mt-1">
          {[minutetime1, minutetime2, ":", secondtime1, secondtime2].map((item, idx) => (
            <span
              key={idx}
              className={`nav-bg text-lg font-semibold text-white text-center ${
                idx === 2 ? "px-1" : "w-6"
              } mx-[1px] rounded-md shadow-md`}
            >
              {item}
            </span>
          ))}
        </div>
        <h5 className="text-base font-bold mt-2 text-black bg-white/30 px-3 py-0.5 rounded-full">
          {wingoPeriodListData?.period || "Loading..."}
        </h5>
      </div>
    </div>
  );

  const renderBetSection = () => (
    <div className="relative mt-3">
      <div className="nav-bg p-3 rounded-xl shadow-inner">
        {/* Color buttons */}
        <div className="flex gap-2">
          {[
            { key: "x", label: "Green", class: "bgs-green" },
            { key: "t", label: "Violet", class: "bgs-violet" },
            { key: "d", label: "Red", class: "bgs-red-200" },
          ].map(({ key, label, class: cls }) => (
            <button
              key={key}
              className={`${cls} text-sm font-bold w-full py-2.5 rounded-lg transition-transform hover:scale-105 shadow-md`}
              onClick={() => selectBetHandle(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Number grid */}
        <div className="bgs-body mt-3 p-2 rounded-xl">
          <div className="grid grid-cols-5 gap-2">
            {ImgData.map((item, i) => (
              <div
                key={i}
                className={`flex justify-center items-center rounded-lg cursor-pointer transition-all hover:scale-110 hover:shadow-lg ${
                  animate ? "animate-bounce" : ""
                }`}
                onClick={() => selectBetHandle(i)}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img src={item} alt={i} className="w-12 md:w-14" />
              </div>
            ))}
          </div>
        </div>

        {/* X Multiplier */}
        <div className="flex items-center justify-between mt-3">
          <button
            className="rounded-lg border-2 border-yellow-500 px-3 py-1.5 text-sm font-bold text-yellow-500 hover:bg-yellow-500/10 transition shadow-md"
            onClick={generateRandomNumber}
          >
            🎲 Random
          </button>
          <div className="flex gap-1">
            {X_DATA.map((item, i) => (
              <button
                key={i}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition ${
                  activeX === i
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                    : "bgs-body text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  setActiveX(i);
                  setMultiplier(item);
                }}
              >
                X{item}
              </button>
            ))}
          </div>
        </div>

        {/* Big/Small */}
        <div className="flex gap-2 mt-3">
          <button
            className="bg-yellow-500 text-black text-sm font-bold w-full py-2.5 rounded-l-xl hover:opacity-90 transition shadow-md"
            onClick={() => selectBetHandle("l")}
          >
            🔴 Big
          </button>
          <button
            className="bgs-blue-500 text-white text-sm font-bold w-full py-2.5 rounded-r-xl hover:opacity-90 transition shadow-md"
            onClick={() => selectBetHandle("n")}
          >
            🔵 Small
          </button>
        </div>
      </div>

      {/* Timer overlay */}
      {openTime && (
        <>
          <div className="flex items-center justify-center absolute inset-0 z-10">
            <span className="text-8xl md:text-[120px] bg-popup-nav/90 text-blue-500 font-bold rounded-2xl w-24 h-32 flex items-center justify-center shadow-2xl border-4 border-blue-500/30">
              0
            </span>
            <span className="ml-4 text-8xl md:text-[120px] bg-popup-nav/90 text-blue-500 font-bold rounded-2xl w-24 h-32 flex items-center justify-center shadow-2xl border-4 border-blue-500/30">
              {secondtime2}
            </span>
          </div>
          <div className="overlay-section2 block" />
        </>
      )}
    </div>
  );

  const renderHistoryTabs = () => (
    <div className="grid grid-cols-3 gap-2 mt-5">
      {[
        { key: "ghistory", label: "📊 Game History" },
        { key: "chart", label: "📈 Chart" },
        { key: "mhistory", label: "📋 My History" },
      ].map(({ key, label }) => (
        <button
          key={key}
          className={`py-2.5 rounded-xl font-bold transition-all ${
            gameHistory === key
              ? "blue-linear text-black shadow-lg scale-105"
              : "nav-bg text-white/70 hover:text-white"
          }`}
          onClick={() => {
            setGameHistory(key);
            if (key === "chart") setTimeout(chartFunction, 100);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderGameHistory = () => {
    if (gameHistory === "ghistory") {
      return (
        <div className="mt-5">
          <div className="grid grid-cols-12 bg-popup-nav/80 rounded-t-xl p-2 font-bold text-sm">
            <div className="col-span-4 text-center text-white">Period</div>
            <div className="col-span-2 text-center text-white">Number</div>
            <div className="col-span-3 text-center text-white">Big/Small</div>
            <div className="col-span-3 text-center text-white">Color</div>
          </div>
          {wingoPeriodListData?.data?.gameslist?.map((item, i) => (
            <div key={i} className="grid grid-cols-12 nav-bg p-2 border-b border-white/5 items-center hover:bg-white/5 transition">
              <div className="col-span-4 text-center text-sm text-white/80 font-medium">{item.period}</div>
              <div className="col-span-2 text-center">
                <span className={`text-2xl font-bold ${getColorClass(item.amount, "text")}`}>
                  {item.amount}
                </span>
              </div>
              <div className="col-span-3 text-center text-sm text-white/80">
                <span className={`px-2 py-0.5 rounded-full ${item.amount > 4 ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {item.amount > 4 ? "Big" : "Small"}
                </span>
              </div>
              <div className="col-span-3 flex justify-center items-center gap-2">
                {[0, 5].includes(item.amount) ? (
                  <>
                    <FaCircle className={item.amount === 0 ? "text-red-500" : "text-green-500"} />
                    <FaCircle className="text-purple-500" />
                  </>
                ) : (
                  <FaCircle className={`${getColorClass(item.amount, "text")} text-lg`} />
                )}
              </div>
            </div>
          ))}
          {renderPagination()}
        </div>
      );
    }

    if (gameHistory === "chart") {
      return (
        <div className="mt-5 nav-bg rounded-xl p-3">
          <div className="bg-darks/50 rounded-lg p-2 flex justify-around font-bold text-white">
            <span>Period</span>
            <span>Number</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70 font-medium">Winning number</span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center text-xs text-white font-bold">
                    {i}
                  </span>
                ))}
              </div>
            </div>
            {[
              { label: "Missing", data: numbers },
              { label: "Avg Missing", data: number2 },
              { label: "Frequency", data: number3 },
              { label: "Max consecutive", data: number4 },
            ].map(({ label, data }, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-white/70 font-medium">{label}</span>
                <div className="flex gap-1">
                  {data.map((num, i) => (
                    <span key={i} className="w-5 text-center text-xs text-white font-bold">{num}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="container2 overflow-x-auto mt-4">
            <ul id="trendList" className="space-y-1 relative">
              {wingoPeriodListData?.data?.gameslist?.map((item, i) => (
                <li key={i} className="flex justify-between items-center bg-white/5 rounded-lg p-1 hover:bg-white/10 transition">
                  <span className="text-sm text-white/60 w-16 font-medium">{item.period}</span>
                  <div className="sec flex gap-1">
                    {Array.from({ length: 10 }, (_, n) => (
                      <span key={n} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${
                        item.amount === n ? "active bg-blue-500 text-white font-bold shadow-lg scale-110" : "text-white/40 border border-white/10"
                      }`}>
                        {n}
                      </span>
                    ))}
                  </div>
                  <span className={`third px-2 py-1 rounded-full text-xs font-bold ${
                    item.amount > 4 ? "bg-yellow-500/30 text-yellow-400" : "bg-blue-500/30 text-blue-400"
                  }`}>
                    {item.amount > 4 ? "B" : "S"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {renderPagination()}
        </div>
      );
    }

    if (gameHistory === "mhistory") {
      return (
        <div className="nav-bg p-3 rounded-xl mt-5">
          <div className="flex justify-end mb-3">
            <Link className="text-cyan-400 border border-cyan-400 rounded-lg px-3 py-1 text-sm flex items-center gap-1 hover:bg-cyan-400/10 transition font-bold">
              Details <IoIosArrowDropright className="text-lg" />
            </Link>
          </div>
          {wingoHistoryData?.gameslist?.length === 0 ? (
            <EmptyData />
          ) : (
            wingoHistoryData?.gameslist?.map((item, i) => (
              <div key={i} className="mb-3 border-b border-white/5 pb-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => handleDetail(i)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-md ${getBetClass(item.bet)}`}>
                      {["x", "d", "t"].includes(item.bet) ? "" : getBetLabel(item.bet)}
                    </div>
                    <div>
                      <h3 className="text-white text-sm font-bold">{item.stage}</h3>
                      <p className="text-xs text-white/50">{item.today}</p>
                    </div>
                  </div>
                  {item.status !== 0 && (
                    <div className="text-right">
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                        item.status === 1 ? "text-green-400 border border-green-400" : "text-red-400 border border-red-400"
                      }`}>
                        {item.status === 1 ? "✅ Succeed" : "❌ Failed"}
                      </span>
                      <p className={`text-sm font-bold mt-1 ${item.status === 1 ? "text-green-400" : "text-red-400"}`}>
                        {item.status === 1 ? "+₹" : "-₹"}
                        {Number(item.status === 1 ? item.get : item.money).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                </div>
                {details === i && (
                  <div className="mt-3 bg-black/40 rounded-xl p-3 space-y-2 text-sm animate-fadeIn">
                    <div className="flex justify-between"><span className="text-white/60">Order number</span><span className="text-white flex items-center gap-1 font-medium">{item.id_product} <PiCopySimpleBold className="cursor-pointer hover:text-cyan-400 transition" onClick={() => copyToClipboard(item.id_product)} /></span></div>
                    <div className="flex justify-between"><span className="text-white/60">Period</span><span className="text-white font-medium">{item.stage}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Purchase amount</span><span className="text-white font-medium">₹{Number(item.money) + Number(item.fee)}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Quantity</span><span className="text-white font-medium">{item.amount}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Amount after tax</span><span className="text-red-400 font-bold">₹{Number(item.money).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Tax</span><span className="text-white font-medium">₹{item.fee}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Result</span><span className={`font-bold ${getColorClass(item.result, "text")}`}>{item.result}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Select</span><span className="text-white font-medium">{getBetLabel(item.bet)}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Status</span><span className={item.status === 1 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{item.status === 1 ? "Succeed" : "Failed"}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Win/Loss</span><span className={item.status === 1 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{item.status === 1 ? "+" : "-"}₹{Number(item.status === 1 ? item.get : item.money).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Order time</span><span className="text-white font-medium">{item.today}</span></div>
                  </div>
                )}
              </div>
            ))
          )}
          {renderPagination()}
        </div>
      );
    }
    return null;
  };

  const renderPagination = () => (
    <div className="flex items-center justify-center gap-4 mt-4">
      <button
        className={`px-4 py-2 rounded-lg transition ${
          pageto / 10 >= 2 ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-white/30 cursor-not-allowed"
        }`}
        disabled={pageto / 10 < 2}
        onClick={handleDecrease}
      >
        <IoIosArrowBack className="text-lg" />
      </button>
      <span className="text-sm text-white/70 font-bold">
        {pageto / 10}/{wingoPeriodListData?.page || 1}
      </span>
      <button
        className={`px-4 py-2 rounded-lg transition ${
          wingoPeriodListData?.page > pageto / 10 ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-white/30 cursor-not-allowed"
        }`}
        disabled={!(wingoPeriodListData?.page > pageto / 10)}
        onClick={handleIncrease}
      >
        <IoIosArrowForward className="text-lg" />
      </button>
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div className="wingo-container relative">
        {/* Time Tabs */}
        {renderTimeTabs()}

        {/* Period Section */}
        {renderPeriodSection()}

        {/* Bet Section */}
        {renderBetSection()}

        {/* History Tabs */}
        {renderHistoryTabs()}

        {/* History Content */}
        {renderGameHistory()}
      </div>

      {/* ====== POPUPS ====== */}

      {/* Bet Popup */}
      {openPopup && (
        <>
          <div className="overlay-section block" onClick={() => setOpenPopup(false)} />
          <div className="nav-bg fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-w-[480px] mx-auto shadow-2xl animate-slideUp">
            <div className={`text-center p-3 rounded-t-3xl ${getBetClass(selectBet)} popup-select-effect`}>
              <h2 className="text-lg font-bold text-black">
                Win Go {activeTime === 10 ? "30s" : activeTime + "Min"}
              </h2>
              <button className="bg-white/90 text-black px-6 py-1 rounded-full text-sm font-bold mt-1 shadow-md">
                Select {getBetLabel(selectBet)}
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-3 text-white">
                <span className="font-medium">Balance</span>
                <div className="flex gap-1">
                  {BALANCE_OPTIONS.map((val) => (
                    <button
                      key={val}
                      className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                        balance === val ? `${getBetClass(selectBet)} text-black shadow-md` : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      onClick={() => setBalance(val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mb-3 text-white">
                <span className="font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBetClass(selectBet)} text-black font-bold shadow-md`}
                    onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    value={multiplier}
                    className="w-16 text-center bg-white/10 border border-white/20 rounded-lg text-white py-1 outline-none font-bold"
                    onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                  />
                  <button
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBetClass(selectBet)} text-black font-bold shadow-md`}
                    onClick={() => setMultiplier(multiplier + 1)}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-1 mb-4">
                {X_DATA.map((item, i) => (
                  <button
                    key={i}
                    className={`px-2.5 py-1 rounded-lg text-sm font-bold transition ${
                      activeX === i ? `${getBetClass(selectBet)} text-black shadow-md scale-105` : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    onClick={() => {
                      setActiveX(i);
                      setMultiplier(item);
                    }}
                  >
                    X{item}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                  className="w-5 h-5 accent-cyan-400"
                />
                <span className="text-white/80 text-sm font-medium">I agree</span>
                <Link className="text-cyan-400 text-sm flex items-center font-bold">
                  <MdKeyboardDoubleArrowLeft /> Pre-sale rules <MdKeyboardDoubleArrowRight />
                </Link>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-white/10 text-white py-2.5 rounded-lg font-bold hover:bg-white/20 transition"
                  onClick={() => setOpenPopup(false)}
                >
                  Cancel
                </button>
                <button
                  className={`flex-1 py-2.5 rounded-lg font-bold transition ${getBetClass(selectBet)} text-black shadow-lg hover:scale-105`}
                  disabled={loader}
                  onClick={handleBet}
                >
                  {loader ? "⏳ Processing..." : `₹${totalAmount.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* How to Play */}
      {openHowtoPlay && (
        <>
          <div className="overlay-section block" />
          <div className="fixed top-20 nav-bg w-[90%] max-w-[400px] rounded-2xl z-50 left-1/2 -translate-x-1/2 shadow-2xl">
            <div className="blue-linear text-black text-center text-xl font-bold py-3 rounded-t-2xl">
              How to play Win Go {activeTime === 10 ? "30s" : activeTime + "Min"}
            </div>
            <div className="h-[300px] overflow-y-auto p-4 text-sm space-y-2">
              {getHowToPlayContent()}
            </div>
            <div className="flex justify-center p-3 bg-black/20 rounded-b-2xl">
              <button className="blue-linear px-10 py-2 rounded-full font-bold text-black shadow-lg hover:scale-105 transition" onClick={() => setHowtoPlay(false)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Result Popup */}
      {resultPopup && winResult !== null && (
        <>
          <div className="overlay-section block" onClick={handleClose} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center">
            <img src={winResult ? WinImg : LoseImg} alt="result" className="w-72 h-auto mx-auto" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4">
              <p className={`text-3xl font-bold ${winResult ? "text-white" : "text-gray-400"}`}>
                {winResult ? "🎉 Congratulations" : "😞 Sorry"}
              </p>
              <div className="flex justify-center items-center gap-2 mt-4">
                <span className={`text-sm ${winResult ? "text-white" : "text-gray-400"}`}>Lottery Result:</span>
                <span className={`px-3 py-0.5 rounded-full text-white text-sm font-bold ${winResult ? "bg-yellow-500" : "bg-gray-600"}`}>
                  {wingoHistoryData?.gameslist?.[0]?.result % 2 === 0 ? "Red" : "Green"}
                </span>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg ${winResult ? "bg-yellow-500" : "bg-gray-600"}`}>
                  {wingoHistoryData?.gameslist?.[0]?.result}
                </span>
                <span className={`px-3 py-0.5 rounded-full text-white text-sm font-bold ${winResult ? "bg-yellow-500" : "bg-gray-600"}`}>
                  {wingoHistoryData?.gameslist?.[0]?.result > 4 ? "Big" : "Small"}
                </span>
              </div>
              {winResult ? (
                <div className="mt-4">
                  <p className="text-red-400 font-bold">Bonus</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    ₹{Number(wingoHistoryData?.gameslist?.[0]?.get).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-500 mt-4">Lose</p>
              )}
              <p className="text-xs text-white/60 mt-2 font-medium">
                Period: Wingo {activeTime === 10 ? "30s" : activeTime + "Min"} {wingoPeriodListData?.data?.gameslist?.[0]?.period}
              </p>
            </div>
            <button className="absolute bottom-10 left-1/2 -translate-x-1/2 text-3xl text-white hover:scale-110 transition" onClick={handleClose}>
              <IoCloseCircleOutline />
            </button>
          </div>
        </>
      )}

      {/* Toast notifications */}
      <CopyCopmponent copyPopup={refershPopup} message="✅ Refreshed successfully" />
      <CopyCopmponent copyPopup={copyPopup} message="📋 Copied to clipboard" />
      <div className={`place-bet-popup ${betAlert ? "active" : ""}`}>
        <div className="text-sm font-bold">{messages}</div>
      </div>
    </>
  );
};

export default Wingo;