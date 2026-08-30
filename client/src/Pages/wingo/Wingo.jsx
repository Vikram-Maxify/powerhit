import debounce from "lodash/debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCircle, FaMinus, FaPlus } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Link, useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";

import CopyCopmponent from "../../components/CopyCopmponent.jsx";
import EmptyData from "../../components/EmptyData.jsx";
import { host } from "../../redux/Slices/api.js";
import "./wingo.css";

// Assets
import Audio1 from "../../assets/audio/di1.mp3";
import Audio2 from "../../assets/audio/di2.mp3";
import EightImg from "../../assets/eight.png";
import FiveImg from "../../assets/five.png";
import FourImg from "../../assets/four.png";
import NineImg from "../../assets/nine.png";
import OneImg from "../../assets/one.png";
import SevenImg from "../../assets/seven.png";
import SixImg from "../../assets/six.png";
import ThreeImg from "../../assets/three.png";
import TimeImg from "../../assets/time.png";
import TimeActiveImg from "../../assets/time_aactive.png";
import TwoImg from "../../assets/two.png";
import ZeroImg from "../../assets/zero.png";

// Constants
const WinImg = "https://i.ibb.co/ssJ2HLw/win-popup.png";
const LoseImg = "https://i.ibb.co/8zTQQmx/loss-popup.png";

const ImgData = [
  ZeroImg,
  OneImg,
  TwoImg,
  ThreeImg,
  FourImg,
  FiveImg,
  SixImg,
  SevenImg,
  EightImg,
  NineImg,
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
  const mockUserDetail = async () => ({
    status: true,
    data: { money_user: 1000 },
  });
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
        {
          bet: "x",
          stage: "2026-01-01",
          today: "2026-01-01",
          status: 1,
          get: 200,
          money: 100,
          fee: 2,
          amount: 5,
          id_product: "12345",
          result: 5,
        },
        {
          bet: "d",
          stage: "2026-01-02",
          today: "2026-01-02",
          status: 2,
          get: 0,
          money: 100,
          fee: 2,
          amount: 5,
          id_product: "12346",
          result: 2,
        },
      ],
      page: 5,
    },
    page: 5,
  });
  const mockWingoBet = async (params) => ({
    status: true,
    message: "Bet placed successfully",
  });

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
          {period} 1 issue,{" "}
          {period === "30 seconds" ? "25" : String(parseInt(period) * 60 - 15)}{" "}
          seconds to order, 15 seconds waiting for the draw. It opens all day.
          Total {total} issues.
        </p>
        <p className="font-bold mt-2 text-white/80">
          If you spend 100 to trade, after deducting 2 service fee, your
          contract amount is 98:
        </p>
        <ul className="list-disc pl-4 space-y-1 text-white/70">
          <li>
            <span className="text-green-400">Green</span>: 1,3,7,9 → (98×2)=196;
            5 → (98×1.5)=147
          </li>
          <li>
            <span className="text-red-400">Red</span>: 2,4,6,8 → (98×2)=196; 0 →
            (98×1.5)=147
          </li>
          <li>
            <span className="text-purple-400">Violet</span>: 0 or 5 →
            (98×4.5)=441
          </li>
          <li>
            <span className="text-blue-400">Number</span>: match → (98×9)=882
          </li>
          <li>
            <span className="text-yellow-400">Big</span>: 5-9 → (98×2)=196
          </li>
          <li>
            <span className="text-cyan-400">Small</span>: 0-4 → (98×2)=196
          </li>
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
      line.setAttribute(
        "x2",
        `${second.offsetLeft + second.offsetWidth / 2}px`,
      );
      line.setAttribute(
        "y2",
        `${second.offsetTop + second.offsetHeight / 2}px`,
      );
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
    [],
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
    [],
  );

  // ---- Socket Listeners ----
  const setSocketListeners = (typeid) => {
    const eventMap = {
      5: "timeUpdate_5",
      3: "timeUpdate_3",
      1: "timeUpdate_11",
      10: "timeUpdate_30",
    };
    const eventName = eventMap[typeid];
    if (!eventName) return;

    socket.off();
    socket.on(eventName, (data) => {
      if (!data) return;
      const { minute, secondtime1, secondtime2 } = data;
      setMinutetime2(minute);
      setSecondtime1(secondtime1);
      setSecondtime2(secondtime2);

      if (
        minute === 0 &&
        secondtime1 === 0 &&
        secondtime2 <= 5 &&
        secondtime2 >= 1
      ) {
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
    navigator.clipboard
      .writeText(String(number))
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
    return () => {
      document.body.style.overflow = "auto";
    };
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
    return () => {
      socket.off();
    };
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
        setTimeout(() => {
          calledRef.current = false;
        }, 2000);
      }

      if (
        msg?.data?.[1]?.period === wingoHistoryData?.gameslist?.[0]?.stage &&
        !calledRef.current
      ) {
        await debouncedFetchResult(typeid1, pageno, pageto);
        setResultPopup(true);
        setTimeout(() => {
          calledRef.current = false;
        }, 2000);
      }
    };

    socket.on("data-server", handler);
    return () => socket.off("data-server", handler);
  }, [
    typeid1,
    pageno,
    pageto,
    betAlert,
    messages,
    wingoHistoryData,
    debouncedFetch,
    debouncedFetchResult,
  ]);

  // ============================================================
  // RENDER HELPERS — GOLDEN UI
  // ============================================================
  const goldCard =
    "rounded-2xl border border-[#d9aa3d]/55 bg-[linear-gradient(145deg,#fffdf7,#fff7df)] shadow-[0_8px_24px_rgba(122,82,10,.10)]";

  const renderTimeTabs = () => (
    <section className={`${goldCard} p-1.5 sm:p-2`}>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {TIME_OPTIONS.map(({ value, label }) => {
          const active = activeTime === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleWingoMinut(value)}
              className={`min-w-0 rounded-xl px-1 py-2.5 transition-all duration-200 sm:py-3 ${
                active
                  ? "bg-[linear-gradient(135deg,#fff3ad,#d99a16,#a96a08)] text-[#2f2109] shadow-[0_5px_14px_rgba(185,125,16,.28)]"
                  : "bg-[#fffaf0] text-[#7d6947] hover:bg-[#f8edcf]"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <img
                  src={active ? TimeActiveImg : TimeImg}
                  alt={label}
                  className={`h-7 w-7 object-contain sm:h-8 sm:w-8 ${active ? "scale-105" : "opacity-80"}`}
                />
                <div className="min-w-0 text-left leading-tight">
                  <p
                    className={`truncate text-[10px] font-extrabold sm:text-[11px] ${active ? "text-[#3c2a0b]" : "text-[#9a8257]"}`}
                  >
                    WIN GO
                  </p>
                  <p className="text-[11px] font-black sm:text-xs">{label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderPeriodSection = () => (
    <section className={`${goldCard} mt-3 overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#d9aa3d]/30 bg-[linear-gradient(135deg,#fff9e8,#f6df9e)] px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a47724] sm:text-xs">
            Current Game
          </p>
          <h2 className="truncate text-base font-black text-[#3c2b12] sm:text-lg">
            Win Go {activeTime === 10 ? "30s" : `${activeTime}Min`}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setHowtoPlay(true)}
          className="shrink-0 rounded-full border border-[#c58c1b] bg-white/80 px-3 py-1.5 text-[11px] font-extrabold text-[#8a5c0b] shadow-sm transition hover:bg-white"
        >
          How to play
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a8257]">
              Recent results
            </span>
            <span className="rounded-full bg-[#f8edcf] px-2 py-0.5 text-[10px] font-bold text-[#9a6c15]">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            {(wingoPeriodListData?.data?.gameslist || [])
              .slice(0, 5)
              .map((item, i) => (
                <img
                  key={i}
                  src={ImgData[item.amount]}
                  alt={String(item.amount)}
                  className="h-8 w-8 shrink-0 rounded-full border border-[#d8ae4e] bg-white p-0.5 shadow-sm sm:h-9 sm:w-9"
                />
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#d8ae4e]/45 bg-[#fffaf0] px-3 py-2 text-center shadow-inner sm:min-w-[150px]">
          <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#9a8257]">
            Time remaining
          </p>
          <div className="mt-1 flex items-center justify-center">
            {[minutetime1, minutetime2, ":", secondtime1, secondtime2].map(
              (item, idx) => (
                <span
                  key={idx}
                  className={`mx-0.5 flex h-7 items-center justify-center rounded-md bg-[#33270f] text-sm font-black text-[#ffe79b] shadow-[inset_0_1px_2px_rgba(255,255,255,.15)] ${idx === 2 ? "w-3 bg-transparent text-[#9d711c] shadow-none" : "w-6"}`}
                >
                  {item}
                </span>
              ),
            )}
          </div>
          <p className="mt-1 truncate text-[10px] font-bold text-[#765a27]">
            {wingoPeriodListData?.period || "Loading..."}
          </p>
        </div>
      </div>
    </section>
  );

  const renderBetSection = () => (
    <section className={`${goldCard} relative mt-3 overflow-hidden`}>
      <div className="bg-[linear-gradient(135deg,#3b2a10,#17130c)] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d9b15a]">
              Place your bet
            </p>
            <h3 className="text-base font-black text-[#fff0b8] sm:text-lg">
              Choose a color or number
            </h3>
          </div>
          <button
            type="button"
            onClick={generateRandomNumber}
            className="rounded-full border border-[#d8a72b] bg-[#fff5ce] px-3 py-1.5 text-[10px] font-black text-[#76500d] shadow-sm transition hover:-translate-y-0.5"
          >
            🎲 Random
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              key: "x",
              label: "Green",
              cls: "bg-[linear-gradient(135deg,#69c86b,#218b43)]",
            },
            {
              key: "t",
              label: "Violet",
              cls: "bg-[linear-gradient(135deg,#bd7cf2,#6f32a8)]",
            },
            {
              key: "d",
              label: "Red",
              cls: "bg-[linear-gradient(135deg,#f36b62,#b82827)]",
            },
          ].map(({ key, label, cls }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectBetHandle(key)}
              className={`${cls} rounded-xl py-3 text-xs font-black text-white shadow-[0_4px_10px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:brightness-105 active:scale-95 sm:text-sm`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-[#a97c25]/50 bg-[#241c0d] p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#c9aa68]">
              Pick a number
            </span>
            <span className="text-[10px] font-bold text-[#8f784b]">0 — 9</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {ImgData.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectBetHandle(i)}
                className={`flex min-w-0 items-center justify-center rounded-xl border border-[#b58a32]/40 bg-[#fffaf0] p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f2c85b] hover:shadow-[0_4px_12px_rgba(220,164,39,.25)] ${animate ? "animate-bounce" : ""}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <img
                  src={item}
                  alt={i}
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-[#c9aa68]">
            Multiplier
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {X_DATA.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveX(i);
                  setMultiplier(item);
                }}
                className={`rounded-lg px-2 py-1.5 text-[10px] font-black transition sm:text-xs ${
                  activeX === i
                    ? "bg-[linear-gradient(135deg,#fff0a5,#d89a17)] text-[#3a2909] shadow-md"
                    : "border border-white/10 bg-white/5 text-[#ead9ae] hover:bg-white/10"
                }`}
              >
                X{item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => selectBetHandle("l")}
            className="rounded-xl bg-[linear-gradient(135deg,#ffe48a,#d59a18)] py-3 text-sm font-black text-[#382607] shadow-md transition hover:-translate-y-0.5"
          >
            Big
            <span className="ml-1 text-[10px] opacity-70">5–9</span>
          </button>
          <button
            type="button"
            onClick={() => selectBetHandle("n")}
            className="rounded-xl border border-[#d2a13b] bg-[#fff9e9] py-3 text-sm font-black text-[#72541c] shadow-md transition hover:-translate-y-0.5"
          >
            Small
            <span className="ml-1 text-[10px] opacity-70">0–4</span>
          </button>
        </div>
      </div>

      {openTime && (
        <>
          <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-[#201608]/80 backdrop-blur-[2px]">
            <span className="flex h-20 w-16 items-center justify-center rounded-xl border-2 border-[#e0ad37] bg-[#33270f] text-5xl font-black text-[#ffe79b] shadow-2xl sm:h-24 sm:w-20 sm:text-6xl">
              0
            </span>
            <span className="flex h-20 w-16 items-center justify-center rounded-xl border-2 border-[#e0ad37] bg-[#33270f] text-5xl font-black text-[#ffe79b] shadow-2xl sm:h-24 sm:w-20 sm:text-6xl">
              {secondtime2}
            </span>
          </div>
          <div className="overlay-section2 pointer-events-none absolute inset-0 z-10" />
        </>
      )}
    </section>
  );

  const renderHistoryTabs = () => (
    <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-[#d9aa3d]/50 bg-[#fffaf0] p-1.5 shadow-[0_6px_18px_rgba(122,82,10,.08)]">
      {[
        { key: "ghistory", label: "History" },
        { key: "chart", label: "Chart" },
        { key: "mhistory", label: "My Bets" },
      ].map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`rounded-xl py-2.5 text-xs font-black transition sm:text-sm ${
            gameHistory === key
              ? "bg-[linear-gradient(135deg,#fff0a5,#d99a18)] text-[#3b2a0b] shadow-md"
              : "text-[#927448] hover:bg-[#f6ebcf]"
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
        <section className={`${goldCard} mt-3 overflow-hidden`}>
          <div className="grid grid-cols-12 border-b border-[#d9aa3d]/35 bg-[linear-gradient(135deg,#3b2a10,#20180c)] px-2.5 py-2.5 text-[10px] font-black uppercase tracking-wide text-[#ffe8a4] sm:text-xs">
            <div className="col-span-4 text-center">Period</div>
            <div className="col-span-2 text-center">Number</div>
            <div className="col-span-3 text-center">Size</div>
            <div className="col-span-3 text-center">Color</div>
          </div>
          {(wingoPeriodListData?.data?.gameslist || []).map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-center border-b border-[#d9aa3d]/20 px-2.5 py-2.5 last:border-0 hover:bg-[#fff8e6]"
            >
              <div className="col-span-4 truncate text-center text-[10px] font-semibold text-[#7b684a] sm:text-xs">
                {item.period}
              </div>
              <div className="col-span-2 text-center">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-lg font-black shadow-sm ${getColorClass(item.amount, "text")} bg-white`}
                >
                  {item.amount}
                </span>
              </div>
              <div className="col-span-3 text-center">
                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-black ${item.amount > 4 ? "bg-[#fff0bd] text-[#9a6a0d]" : "bg-[#f1eadb] text-[#78644a]"}`}
                >
                  {item.amount > 4 ? "BIG" : "SMALL"}
                </span>
              </div>
              <div className="col-span-3 flex justify-center gap-1">
                {[0, 5].includes(item.amount) ? (
                  <>
                    <FaCircle
                      className={
                        item.amount === 0 ? "text-red-500" : "text-green-500"
                      }
                    />
                    <FaCircle className="text-purple-500" />
                  </>
                ) : (
                  <FaCircle
                    className={`${getColorClass(item.amount, "text")} text-sm`}
                  />
                )}
              </div>
            </div>
          ))}
          {renderPagination()}
        </section>
      );
    }

    if (gameHistory === "chart") {
      return (
        <section className={`${goldCard} mt-3 overflow-hidden p-3 sm:p-4`}>
          <div className="rounded-xl bg-[#fff7df] p-2.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#8b6a2e] sm:text-xs">
              <span>Period</span>
              <span>Winning Number</span>
            </div>
            <div className="mt-3 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className="flex h-6 items-center justify-center rounded-full border border-[#d8ae4e] bg-white text-[9px] font-black text-[#76592b]"
                >
                  {i}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {[
                { label: "Missing", data: numbers },
                { label: "Avg Missing", data: number2 },
                { label: "Frequency", data: number3 },
                { label: "Max Consecutive", data: number4 },
              ].map(({ label, data }, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[92px_1fr] items-center gap-2"
                >
                  <span className="text-[9px] font-bold text-[#8b7652] sm:text-xs">
                    {label}
                  </span>
                  <div className="grid grid-cols-10 gap-1">
                    {data.map((num, i) => (
                      <span
                        key={i}
                        className="text-center text-[9px] font-black text-[#695536]"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="container2 mt-3 max-w-full overflow-x-auto rounded-xl border border-[#d9aa3d]/25 bg-[#fffaf0] p-2">
            <ul id="trendList" className="relative min-w-[430px] space-y-1">
              {(wingoPeriodListData?.data?.gameslist || []).map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#d9aa3d]/15 bg-white px-2 py-1.5"
                >
                  <span className="w-16 shrink-0 text-[9px] font-bold text-[#8c7754]">
                    {item.period}
                  </span>
                  <div className="sec flex gap-1">
                    {Array.from({ length: 10 }, (_, n) => (
                      <span
                        key={n}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${item.amount === n ? "active bg-[#d79b1c] text-white shadow-md" : "border border-[#e4d5b3] text-[#b5a27f]"}`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`third shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${item.amount > 4 ? "bg-[#fff0bd] text-[#9a6a0d]" : "bg-[#f0eadf] text-[#78644a]"}`}
                  >
                    {item.amount > 4 ? "B" : "S"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {renderPagination()}
        </section>
      );
    }

    return (
      <section className={`${goldCard} mt-3 overflow-hidden p-3 sm:p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9c7a3d]">
              Your activity
            </p>
            <h3 className="text-base font-black text-[#3b2b13]">My Bets</h3>
          </div>
          <Link className="rounded-full border border-[#d1a13b] px-3 py-1 text-[10px] font-black text-[#8a620f]">
            Details
          </Link>
        </div>
        {wingoHistoryData?.gameslist?.length === 0 ? (
          <EmptyData />
        ) : (
          (wingoHistoryData?.gameslist || []).map((item, i) => (
            <div
              key={i}
              className="mb-2 rounded-xl border border-[#d9aa3d]/20 bg-[#fffaf0] p-3 last:mb-0"
            >
              <div
                className="flex min-w-0 cursor-pointer items-center justify-between gap-3"
                onClick={() => handleDetail(i)}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[9px] font-black shadow-sm ${getBetClass(item.bet)}`}
                  >
                    {["x", "d", "t"].includes(item.bet)
                      ? "●"
                      : getBetLabel(item.bet)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-black text-[#4b3b20] sm:text-sm">
                      {item.stage}
                    </h3>
                    <p className="truncate text-[10px] text-[#9a8564]">
                      {item.today}
                    </p>
                  </div>
                </div>
                {item.status !== 0 && (
                  <div className="shrink-0 text-right">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${item.status === 1 ? "border-green-500 text-green-600" : "border-red-400 text-red-500"}`}
                    >
                      {item.status === 1 ? "Succeed" : "Failed"}
                    </span>
                    <p
                      className={`mt-1 text-xs font-black ${item.status === 1 ? "text-green-600" : "text-red-500"}`}
                    >
                      {item.status === 1 ? "+₹" : "-₹"}
                      {Number(
                        item.status === 1 ? item.get : item.money,
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
              {details === i && (
                <div className="mt-3 space-y-1.5 rounded-xl bg-[#f6ecd5] p-3 text-[10px] sm:text-xs">
                  {[
                    ["Order number", item.id_product],
                    ["Period", item.stage],
                    [
                      "Purchase amount",
                      `₹${Number(item.money) + Number(item.fee)}`,
                    ],
                    ["Quantity", item.amount],
                    [
                      "Amount after tax",
                      `₹${Number(item.money).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                    ],
                    ["Tax", `₹${item.fee}`],
                    ["Result", item.result],
                    ["Select", getBetLabel(item.bet)],
                    ["Status", item.status === 1 ? "Succeed" : "Failed"],
                    [
                      "Win/Loss",
                      `${item.status === 1 ? "+" : "-"}₹${Number(item.status === 1 ? item.get : item.money).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                    ],
                    ["Order time", item.today],
                  ].map(([label, value], n) => (
                    <div
                      key={n}
                      className="flex items-start justify-between gap-3 border-b border-[#d4bd8d]/35 py-1 last:border-0"
                    >
                      <span className="text-[#927b53]">{label}</span>
                      <span className="break-all text-right font-bold text-[#4c3a1c]">
                        {value}
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.id_product)}
                    className="mt-1 font-black text-[#a06d0d]"
                  >
                    Copy order number
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        {renderPagination()}
      </section>
    );
  };

  const renderPagination = () => (
    <div className="flex items-center justify-center gap-3 border-t border-[#d9aa3d]/20 px-2 pb-1 pt-3">
      <button
        type="button"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${pageto / 10 >= 2 ? "border-[#d4a237] bg-[#fff4cf] text-[#805a17] hover:bg-[#f7e7bb]" : "border-[#e5dbc5] bg-[#f7f3ea] text-[#c9c0ae]"}`}
        disabled={pageto / 10 < 2}
        onClick={handleDecrease}
      >
        <IoIosArrowBack />
      </button>
      <span className="min-w-[64px] text-center text-xs font-black text-[#7d6338]">
        {pageto / 10}/{wingoPeriodListData?.page || 1}
      </span>
      <button
        type="button"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${wingoPeriodListData?.page > pageto / 10 ? "border-[#d4a237] bg-[#fff4cf] text-[#805a17] hover:bg-[#f7e7bb]" : "border-[#e5dbc5] bg-[#f7f3ea] text-[#c9c0ae]"}`}
        disabled={!(wingoPeriodListData?.page > pageto / 10)}
        onClick={handleIncrease}
      >
        <IoIosArrowForward />
      </button>
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <main className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,#fffdf6_0%,#fff8e8_42%,#f4ead2_100%)] text-[#3b2b13]">
        <div className="mx-auto w-full max-w-[520px] overflow-x-hidden px-3 pb-8 pt-3 sm:px-4 sm:pt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#a47724]">
                Royal Gaming
              </p>
              <h1 className="text-xl font-black tracking-tight text-[#33250e] sm:text-2xl">
                WIN GO
              </h1>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#d9aa3d]/45 bg-white/75 px-3 py-1.5 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-[#80632c]">
                LIVE
              </span>
            </div>
          </div>

          {renderTimeTabs()}
          {renderPeriodSection()}
          {renderBetSection()}
          {renderHistoryTabs()}
          {renderGameHistory()}
        </div>
      </main>

      {/* ====== POPUPS ====== */}
      {openPopup && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setOpenPopup(false)}
          />
          <div className="fixed bottom-[76px] left-1/2 z-50 w-[calc(100%-16px)] max-w-[500px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border border-[#d9aa3d]/55 bg-[#21180b] shadow-[0_-10px_40px_rgba(0,0,0,.35)]">
            <div
              className={`p-4 text-center ${getBetClass(selectBet)} popup-select-effect`}
            >
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-black/65">
                Win Go {activeTime === 10 ? "30s" : `${activeTime}Min`}
              </p>
              <h2 className="mt-1 text-xl font-black text-black">
                Select {getBetLabel(selectBet)}
              </h2>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-3 text-white">
                <span className="text-sm font-bold">Balance</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {BALANCE_OPTIONS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`rounded-lg px-2.5 py-1 text-xs font-black ${balance === val ? `${getBetClass(selectBet)} text-black shadow-md` : "bg-white/10 text-white"}`}
                      onClick={() => setBalance(val)}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-white">
                <span className="text-sm font-bold">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0ad] font-black text-[#3a2909]"
                    onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={multiplier}
                    className="h-9 w-16 rounded-lg border border-white/20 bg-white/10 text-center font-black text-white outline-none"
                    onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
                  />
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0ad] font-black text-[#3a2909]"
                    onClick={() => setMultiplier(multiplier + 1)}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {X_DATA.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rounded-lg py-2 text-[10px] font-black ${activeX === i ? `${getBetClass(selectBet)} text-black shadow-md` : "bg-white/10 text-white"}`}
                    onClick={() => {
                      setActiveX(i);
                      setMultiplier(item);
                    }}
                  >
                    X{item}
                  </button>
                ))}
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                  className="h-4 w-4 accent-yellow-400"
                />
                <span>I agree</span>
                <span className="font-bold text-[#e9bd50]">Pre-sale rules</span>
              </label>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => setOpenPopup(false)}
                  className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] py-3.5 text-sm font-extrabold text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_4px_12px_rgba(0,0,0,.18)] transition-all duration-200 hover:border-white/25 hover:bg-white/[0.10] hover:text-white active:scale-[.97]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-base opacity-70">✕</span>
                    Cancel
                  </span>
                </button>

                {/* Submit Bet */}
                <button
                  type="button"
                  disabled={loader || !isChecked}
                  onClick={handleBet}
                  className="group relative overflow-hidden rounded-xl border border-[#f5cf68]/70 bg-gradient-to-b from-[#ffe58a] via-[#e0ad2d] to-[#b97908] py-3.5 text-sm font-black text-[#2b1b03] shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_5px_16px_rgba(201,148,29,.28)] transition-all duration-200 hover:brightness-105 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale-[.2]"
                >
                  {/* Shine */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loader ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b1b03]/30 border-t-[#2b1b03]" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="text-base">✓</span>
                        Submit Bet
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {openHowtoPlay && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setHowtoPlay(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#d9aa3d] bg-[#241b0c] shadow-2xl">
            <div className="bg-[linear-gradient(135deg,#fff0a5,#d99a18)] px-4 py-3 text-center text-lg font-black text-[#3a2909]">
              How to Play — Win Go{" "}
              {activeTime === 10 ? "30s" : `${activeTime}Min`}
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 text-sm leading-6">
              {getHowToPlayContent()}
            </div>
            <div className="border-t border-white/10 p-3 text-center">
              <button
                type="button"
                className="rounded-full bg-[linear-gradient(135deg,#fff0a5,#d99a18)] px-10 py-2 font-black text-[#3a2909] shadow-lg"
                onClick={() => setHowtoPlay(false)}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {resultPopup && winResult !== null && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-28px)] max-w-[390px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-[#d9aa3d] bg-[linear-gradient(145deg,#2c200d,#120e08)] p-5 text-center shadow-[0_20px_70px_rgba(0,0,0,.55)]">
            <img
              src={winResult ? WinImg : LoseImg}
              alt="result"
              className="mx-auto h-auto max-h-32 w-auto max-w-[80%] object-contain"
            />
            <p
              className={`mt-3 text-2xl font-black ${winResult ? "text-[#ffe79b]" : "text-white/70"}`}
            >
              {winResult ? "Congratulations" : "Sorry"}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-white/60">Result</span>
              <span
                className={`rounded-full px-3 py-1 font-black text-white ${winResult ? "bg-green-600" : "bg-gray-600"}`}
              >
                {wingoHistoryData?.gameslist?.[0]?.result % 2 === 0
                  ? "Red"
                  : "Green"}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-black text-white ${winResult ? "bg-[#d99a18]" : "bg-gray-600"}`}
              >
                {wingoHistoryData?.gameslist?.[0]?.result}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-black text-white ${winResult ? "bg-[#d99a18]" : "bg-gray-600"}`}
              >
                {wingoHistoryData?.gameslist?.[0]?.result > 4 ? "Big" : "Small"}
              </span>
            </div>
            {winResult ? (
              <p className="mt-4 text-3xl font-black text-[#ffd85a]">
                ₹
                {Number(wingoHistoryData?.gameslist?.[0]?.get).toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                )}
              </p>
            ) : (
              <p className="mt-4 text-xl font-black text-white/45">Lose</p>
            )}
            <p className="mt-2 text-[10px] text-white/50">
              Period: Wingo {activeTime === 10 ? "30s" : `${activeTime}Min`}{" "}
              {wingoPeriodListData?.data?.gameslist?.[0]?.period}
            </p>
            <button
              type="button"
              className="mt-4 rounded-full border border-white/15 bg-white/10 px-6 py-2 text-xs font-black text-white"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </>
      )}

      <CopyCopmponent
        copyPopup={refershPopup}
        message="✅ Refreshed successfully"
      />
      <CopyCopmponent copyPopup={copyPopup} message="📋 Copied to clipboard" />
      <div className={`place-bet-popup ${betAlert ? "active" : ""}`}>
        <div className="text-sm font-bold">{messages}</div>
      </div>
    </>
  );
};

export default Wingo;
