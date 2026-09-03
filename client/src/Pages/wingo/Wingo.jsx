import debounce from "lodash/debounce";
import { Crown, Gem, Shuffle, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCircle, FaMinus, FaPlus } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";

import EmptyData from "../../components/EmptyData.jsx";
import { host } from "../../redux/slices/api.js";
import { getProfile } from "../../redux/Slices/authSlice.js";
import {
  getMyBets,
  getOrderList,
  placeBet,
} from "../../redux/slices/betSlice.js";
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

// Game mapping for socket events
const GAME_EVENT_MAP = {
  10: { event: "timeUpdate_30", game: "wingo10", type: 10 },
  1: { event: "timeUpdate_11", game: "wingo", type: 1 },
  3: { event: "timeUpdate_3", game: "wingo3", type: 3 },
  5: { event: "timeUpdate_5", game: "wingo5", type: 5 },
};

const socket = io(host, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// ============================================================
// MAIN COMPONENT
// ============================================================
const Wingo = () => {
  const dispatch = useDispatch();

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
  const [periodData, setPeriodData] = useState(null);
  const [lastResultPeriod, setLastResultPeriod] = useState(null);
  // Track if user has bet in current period
  const [hasUserBet, setHasUserBet] = useState(false);
  // Track current period to check against
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(0);

  // ---- Refs ----
  const intervalRef = useRef(null);
  const calledRef = useRef(false);
  const isConnectedRef = useRef(false);
  const audio1Ref = useRef(new Audio(Audio1));
  const audio2Ref = useRef(new Audio(Audio2));
  const timerIntervalRef = useRef(null);
  const resultProcessedRef = useRef(new Set());
  const displayedResultRef = useRef(new Set());
  const lastPlayedCountdownRef = useRef(null);

  // ---- Router ----
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const Game = queryParams.get("Game");

  // ---- Derived ----
  const totalAmount = balance * multiplier;
  const currentGameInfo = GAME_EVENT_MAP[typeid1] || GAME_EVENT_MAP[10];

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
        <p className="font-bold text-[#30281B]">
          {period} 1 issue,{" "}
          {period === "30 seconds" ? "25" : String(parseInt(period) * 60 - 15)}{" "}
          seconds to order, 15 seconds waiting for the draw. It opens all day.
          Total {total} issues.
        </p>
        <p className="font-bold mt-2 text-[#5A410C]">
          If you spend 100 to trade, after deducting 2 service fee, your
          contract amount is 98:
        </p>
        <ul className="list-disc pl-4 space-y-1 text-[#7A5A1A]">
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
  // FUNCTIONS
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

  // ---- Real API calls (via Redux thunks) ----
  const fetchHistory = async () => {
    try {
      const res = await dispatch(
        getMyBets({ typeid: typeid1, pageno, pageto }),
      ).unwrap();
      setWingoHistoryData({
        ...res,
        gameslist: res?.data?.gameslist || [],
      });
      setHistoryPage(res?.page);
    } catch (err) {
      console.error("fetchHistory failed:", err);
    }
  };

  const fetchNewData = async (pageno, pageto) => {
    try {
      const res = await dispatch(
        getOrderList({ typeid: typeid1, pageno, pageto }),
      ).unwrap();
      if (res.status) {
        setWingoPeriodListData(res);
        setPeriodData(res);
        // Store current period
        if (res.period) {
          setCurrentPeriod(res.period);
        }
        setTimeout(chartFunction, 100);
      }
    } catch (err) {
      console.error("fetchNewData failed:", err);
    }
    await fetchHistory();
  };

  // ---- Debounced Functions ----
  const debouncedFetch = useCallback(
    debounce(async (typeid1, pageno, pageto) => {
      try {
        const res = await dispatch(
          getOrderList({ typeid: typeid1, pageno, pageto }),
        ).unwrap();
        if (res.status) {
          setWingoPeriodListData(res);
          setPeriodData(res);
          if (res.period) {
            setCurrentPeriod(res.period);
          }
          setTimeout(chartFunction, 100);
        }
      } catch (err) {
        console.error("debouncedFetch (period list) failed:", err);
      }

      try {
        const historyRes = await dispatch(
          getMyBets({ typeid: typeid1, pageno, pageto }),
        ).unwrap();
        setWingoHistoryData(historyRes);
        setHistoryPage(historyRes?.page);
      } catch (err) {
        console.error("debouncedFetch (history) failed:", err);
      }

      updateNumbers();
    }, 500),
    [dispatch],
  );

  // ============================================================
  // SOCKET LISTENERS - DURATION SAFE
  // ============================================================

  const setSocketListeners = useCallback(
    (typeid) => {
      const gameInfo = GAME_EVENT_MAP[typeid];
      if (!gameInfo) return;

      const { event: timerEvent, game: currentGame } = gameInfo;

      // Every listener created here belongs to the currently selected game.
      // Remove the previous listeners before attaching the new ones.
      socket.off(timerEvent);
      socket.off("data-server");

      // ---- Timer update: ONLY current selected duration ----
      const handleTimerUpdate = (data) => {
        if (!data) return;

        const minute = Number(data.minute) || 0;
        const second1 = Number(data.secondtime1) || 0;
        const second2 = Number(data.secondtime2) || 0;

        // Ignore timer packets if this is no longer the active tab.
        if (Number(typeid1) !== Number(typeid)) return;

        setMinutetime2(minute);
        setSecondtime1(second1);
        setSecondtime2(second2);

        // When the selected game's timer reaches 00:00:00,
        // refresh ONLY that game's data.
        if (minute === 0 && second1 === 0 && second2 === 0) {
          setOpenTime(true);
          setOpenPopup(false);

          debouncedFetch(typeid, 1, 10);

          if (activeVoice) playAudio(audio1Ref);
        } else {
          setOpenTime(false);
        }

        if (minute === 0 && second1 === 5 && second2 === 9 && activeVoice) {
          playAudio(audio2Ref);
        }
      };

      socket.on(timerEvent, handleTimerUpdate);

      // ---- Result listener: ONLY current duration/game ----
      const handleDataServer = async (msg) => {
        if (!msg?.data || !Array.isArray(msg.data)) return;

        // IMPORTANT:
        // data-server can contain results for multiple games at the same time.
        // Never use another game's result in the active tab.
        const resultForCurrentGame = msg.data.find(
          (item) => item?.game === currentGame,
        );

        if (!resultForCurrentGame) return;

        // User may have switched tabs while this socket packet was arriving.
        if (Number(typeid1) !== Number(typeid)) return;

        const period = String(resultForCurrentGame.period ?? "");
        if (!period) return;

        // Include game + type in the key so the same period number from
        // different durations can NEVER block each other.
        const processKey = `${currentGame}:${typeid}:${period}`;

        // HARD CLIENT GUARD:
        // One period + one game + one duration can be displayed only once.
        if (resultProcessedRef.current.has(processKey)) {
          console.log(
            `[${currentGame}] ${period} already handled on client. SKIP duplicate.`,
          );
          return;
        }

        resultProcessedRef.current.add(processKey);

        console.log(
          `[${currentGame}] Result received | type=${typeid} | period=${period} | amount=${resultForCurrentGame.amount}`,
        );

        try {
          // Fetch ONLY this duration's period list.
          await debouncedFetch(typeid, 1, 10);

          // User could switch to another tab while the request was running.
          if (Number(typeid1) !== Number(typeid)) return;

          // Fetch ONLY this duration's bets.
          const historyRes = await dispatch(
            getMyBets({ typeid, pageno: 1, pageto: 10 }),
          ).unwrap();

          // Ignore stale response after a tab switch.
          if (Number(typeid1) !== Number(typeid)) return;

          const gameslist = historyRes?.data?.gameslist || [];

          setWingoHistoryData({
            ...historyRes,
            data: historyRes?.data || { gameslist: [] },
            gameslist,
          });

          // Only the current game's period is checked.
          const betInThisPeriod = gameslist.some(
            (bet) => String(bet?.stage) === period,
          );

          console.log(
            `[${currentGame}] Period ${period}, user bet=${betInThisPeriod}`,
          );

          if (betInThisPeriod) {
            const lastBet = gameslist.find(
              (bet) => String(bet?.stage) === period,
            );

            setHasUserBet(true);
            setWinResult(lastBet ? lastBet.status === 1 : true);
            setResultPopup(true);
            setLastResultPeriod(period);
          } else {
            setHasUserBet(false);
            setResultPopup(false);
          }

          // Refresh balance only after processing the current duration.
          try {
            const profile = await dispatch(getProfile()).unwrap();
            if (Number(typeid1) === Number(typeid)) {
              setUserInfo(profile);
            }
          } catch (err) {
            console.error("Profile refresh failed:", err);
          }
        } catch (err) {
          console.error(
            `[${currentGame}] Result processing failed for period ${period}:`,
            err,
          );
          setResultPopup(false);
        }
      };

      socket.on("data-server", handleDataServer);

      return () => {
        socket.off(timerEvent, handleTimerUpdate);
        socket.off("data-server", handleDataServer);
      };
    },
    [activeVoice, debouncedFetch, dispatch, typeid1],
  );

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleWingoMinut = (data) => {
    const nextType = Number(data);
    if (!GAME_EVENT_MAP[nextType]) return;

    // Immediately switch the UI to the selected duration.
    setActiveTime(nextType);
    setTypeid1(nextType);
    localStorage.setItem("wingominute", String(nextType));

    setPage(1);
    setPageto(10);

    // Clear old duration data immediately so, for example, a 30s result
    // cannot remain visible for a moment inside the 1/3/5 minute tab.
    setWingoPeriodListData(null);
    setWingoHistoryData(null);
    setPeriodData(null);
    setCurrentPeriod(null);
    setMinutetime2(0);
    setSecondtime1(0);
    setSecondtime2(0);

    // A period is unique per game, not globally.
    resultProcessedRef.current = {};
    setHasUserBet(false);
    setResultPopup(false);
    setWinResult(null);
    setLastResultPeriod(null);

    // Fetch only the newly selected duration.
    debouncedFetch(nextType, 1, 10);
    navigate(`/wingo?Game=${nextType}`);
  };

  const handleVoice = () => {
    const newState = !activeVoice;
    setActiveVoice(newState);
    localStorage.setItem("voice", newState);
  };

  const handleDetail = (i) => setDetails(details === i ? null : i);

  const handleRefersh = async () => {
    try {
      const profile = await dispatch(getProfile()).unwrap();
      setRefeshPopup(true);
      setUserInfo(profile);
      setTimeout(() => setRefeshPopup(false), 2000);
    } catch (err) {
      console.error("Refresh failed:", err);
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
    if (!selectBet && selectBet !== 0) {
      setMessage("Please select a bet first");
      setBetAlert(true);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoader(true);
    try {
      const res = await dispatch(
        placeBet({
          typeid: typeid1,
          join: selectBet,
          x: multiplier,
          money: balance,
        }),
      ).unwrap();

      setOpenPopup(false);
      setShowSuccessPopup(true);
      setBalance(1);
      setMultiplier(1);
      setActiveX(0);
      localStorage.setItem("bet", true);
      setTimeout(() => setShowSuccessPopup(false), 1800);

      await fetchHistory();

      try {
        const profile = await dispatch(getProfile()).unwrap();
        setUserInfo(profile);
      } catch (err) {
        console.error("Profile refresh after bet failed:", err);
      }
    } catch (err) {
      setBetAlert(true);
      setMessage(typeof err === "string" ? err : "Bet failed");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoader(false);
    }
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
    setHasUserBet(false);
  };

  // ============================================================
  // EFFECTS
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
  }, []);

  useEffect(() => {
    if (typeid1 !== null) {
      updateNumbers();
      openAudio();
      // Reset result tracker when typeid changes
      // Do not clear result history when switching tabs.
      // The same socket result must never be shown twice.
      resultProcessedRef.current = resultProcessedRef.current;
      setHasUserBet(false);
      setResultPopup(false);
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

  // ---- Socket Connection ----
  useEffect(() => {
    if (!isConnectedRef.current) {
      socket.connect();
      isConnectedRef.current = true;
    }

    // Attach listeners only for the selected duration.
    const cleanupListeners = setSocketListeners(typeid1);

    return () => {
      if (typeof cleanupListeners === "function") {
        cleanupListeners();
      }
    };
  }, [typeid1, activeVoice, setSocketListeners]);

  useEffect(() => {
    return () => {
      socket.disconnect();
      isConnectedRef.current = false;
    };
  }, []);

  // ---- Auto-close Result Popup after 3 seconds ----
  useEffect(() => {
    if (resultPopup && winResult !== null && hasUserBet) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resultPopup, winResult, hasUserBet]);

  // ---- Final Countdown Overlay ----
  useEffect(() => {
    // Calculate total remaining seconds
    const totalRemainingSeconds =
      minutetime2 * 60 + secondtime1 * 10 + secondtime2;

    // Determine when countdown should start based on game type
    const countdownStartAt = activeTime === 10 ? 5 : 10;

    // Check if we're in the final countdown window
    if (
      totalRemainingSeconds > 0 &&
      totalRemainingSeconds <= countdownStartAt
    ) {
      setShowCountdownOverlay(true);
      setCountdownNumber(totalRemainingSeconds);

      // Play audio only when the countdown number changes (not on every render)
      if (
        lastPlayedCountdownRef.current !== totalRemainingSeconds &&
        activeVoice
      ) {
        try {
          // Reset audio to start and play
          audio1Ref.current.currentTime = 0;
          audio1Ref.current.play().catch(() => {
            // Silently catch audio play errors (e.g., browser restrictions)
          });
        } catch (err) {
          // Silently handle any audio errors
        }
        lastPlayedCountdownRef.current = totalRemainingSeconds;
      }
    } else {
      setShowCountdownOverlay(false);
      setCountdownNumber(0);
      // Reset the last played countdown when we exit the countdown window
      if (totalRemainingSeconds === 0) {
        lastPlayedCountdownRef.current = null;
      }
    }
  }, [minutetime2, secondtime1, secondtime2, activeTime, activeVoice]);

  // ============================================================
  // RENDER HELPERS
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
                  className={`h-7 w-7 object-contain sm:h-8 sm:w-8 ${
                    active ? "scale-105" : "opacity-80"
                  }`}
                />
                <div className="min-w-0 text-left leading-tight">
                  <p
                    className={`truncate text-[10px] font-extrabold sm:text-[11px] ${
                      active ? "text-[#3c2a0b]" : "text-[#9a8257]"
                    }`}
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

  // 👇 Yahan apna imgbb wala Win Go banner URL paste karo (Image 1)
  const WINGO_BANNER_BG =
    "https://i.ibb.co/Fk1Wgj2P/Chat-GPT-Image-Sep-3-2026-04-52-17-PM.png";

  const renderPeriodSection = () => (
    <section
      className="relative mt-3 h-[260px] overflow-hidden rounded-2xl py-3 border border-[#d9aa3d]/40 bg-cover bg-center bg-no-repeat shadow-lg sm:min-h-[240px]"
      style={{ backgroundImage: `url(${WINGO_BANNER_BG})`, loading: "lazy" }}
    >
      {/* Header row — title left, "How to play" pill right */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a5c0b] sm:text-xs">
            Current Game
          </p>
          <h2 className="truncate font-black border-b border-[#d9aa3d]/70 mt-2 text-[#3c2b12] drop-shadow-sm text-xl">
            Wingo {activeTime === 10 ? "30s" : `${activeTime}Min`}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setHowtoPlay(true)}
          className="shrink-0 px-3 py-1.5 text-[11px] font-extrabold text-[#8a5c0b] transition -mt-[2.25rem]"
        >
          How to play
        </button>
      </div>

      {/* Bottom row — recent results left, time-remaining card right */}
      <div className="grid grid-cols-1 gap-2 px-4 pb-[0.5rem] sm:grid-cols-[1fr_auto] sm:items-center sm:px-5 sm:pb-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5b4321]">
              Recent results
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

        <div className="rounded-xl border border-[#d8ae4e]/50 bg-[#fffaf0]/90 px-3 py-2 text-center shadow-md backdrop-blur-sm w-[180px]">
          <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#9a8257]">
            Time remaining
          </p>
          <div className="mt-1 flex items-center justify-center">
            <span
              className="mx-0.5 flex h-10 w-8 items-center justify-center rounded-md  bg-gradient-to-b
          from-[#FFF19A]
          via-[#FFC928]
          to-[#D99200]
          border
          border-[#FFD75A]
          shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-2xl font-black text-white "
            >
              {minutetime1}
            </span>
            <span
              className="mx-0.5 flex h-10 w-8 items-center justify-center rounded-md  bg-gradient-to-b
          from-[#FFF19A]
          via-[#FFC928]
          to-[#D99200]
          border
          border-[#FFD75A]
          shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-2xl font-black text-white "
            >
              {minutetime2}
            </span>
            <span className="mx-0.5 flex h-10 w-8 items-center justify-center rounded-md bg-transparent text-2xl font-black text-black shadow-none">
              :
            </span>
            <span
              className="mx-0.5 flex h-10 w-8 items-center justify-center rounded-md  bg-gradient-to-b
          from-[#FFF19A]
          via-[#FFC928]
          to-[#D99200]
          border
          border-[#FFD75A]
          shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-2xl font-black text-white "
            >
              {secondtime1}
            </span>
            <span
              className="mx-0.5 flex h-10 w-8 items-center justify-center rounded-md  bg-gradient-to-b
          from-[#FFF19A]
          via-[#FFC928]
          to-[#D99200]
          border
          border-[#FFD75A]
          shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-2xl font-black text-white "
            >
              {secondtime2}
            </span>
          </div>
          <p className="mt-1 truncate text-[12px] font-semibold text-[#765a27]">
            Period:
            {wingoPeriodListData?.period || "Loading..."}
          </p>
        </div>
      </div>
    </section>
  );

  // 👇 Agar tumhare paas already koi state hai jo current selected bet-type
  // (color / number / big-small) track karta hai, to yahan uska naam use karo.
  // Neeche maine sirf Big/Small ke active-highlight ke liye ek naya state
  // add kiya hai — agar tumhara `selectBetHandle` already kahi is type ka
  // selection store karta hai, to `activeBigSmall` ki jagah wahi variable
  // use kar lena, duplicate state nahi chahiye.
  const [activeBigSmall, setActiveBigSmall] = useState(null); // "l" = Big, "n" = Small

  const renderBetSection = () => (
    <section
      className={`${goldCard} relative mt-3 overflow-hidden bg-[linear-gradient(160deg,#fffdf6,#fdf3d8)] p-3 sm:p-4`}
    >
      {/* ===== Header: "PLACE YOUR BET" + Random ===== */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2 text-[#c9941f]">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d8a72b]/70" />
          <h3 className="shrink-0 text-sm font-black uppercase tracking-[.1em] text-[#b8801a] sm:text-base">
            Place your bet
          </h3>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d8a72b]/70" />
        </div>
        <button
          type="button"
          onClick={generateRandomNumber}
          className="shrink-0 flex items-center gap-1 rounded-full border border-[#e3c67c] bg-white px-3 py-1.5 text-[11px] font-black text-[#8a6a1f] shadow-sm transition hover:-translate-y-0.5"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Random
        </button>
      </div>

      {/* ===== Color bets: Green / Violet / Red ===== */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            key: "x",
            label: "Green",
            gradient: "from-[#d7f3d9] to-[#a9e6ae]",
            border: "border-[#7fce89]",
            text: "text-[#1c7a34]",
            gem: "text-[#22a744]",
          },
          {
            key: "t",
            label: "Violet",
            gradient: "from-[#e5dcfb] to-[#c6adf6]",
            border: "border-[#a97cf2]",
            text: "text-[#5b2f9c]",
            gem: "text-[#8b5cf6]",
          },
          {
            key: "d",
            label: "Red",
            gradient: "from-[#fbdcdb] to-[#f5b0ac]",
            border: "border-[#ec7c74]",
            text: "text-[#a6221b]",
            gem: "text-[#e0342a]",
          },
        ].map(({ key, label, gradient, border, text, gem }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectBetHandle(key)}
            className={`bg-gradient-to-br ${gradient} rounded-2xl border ${border} px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-black ${text} sm:text-base`}>
                {label}
              </span>
              <Gem className={`h-6 w-6 ${gem} drop-shadow-sm`} />
            </div>
          </button>
        ))}
      </div>

      {/* ===== Pick a number + Multiplier ===== */}
      <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-[#e3c67c]/70 bg-white/70 p-3 shadow-sm sm:grid-cols-[1fr_auto_auto] sm:items-stretch sm:gap-4 sm:p-4">
        {/* Pick a number */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a6821f] sm:text-xs">
              Pick a number
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ImgData.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectBetHandle(i)}
                className={`flex items-center justify-center rounded-xl border border-[#e3c67c]/70 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#f2c85b] hover:shadow-[0_4px_12px_rgba(220,164,39,.25)] active:scale-95 ${
                  animate ? "animate-bounce" : ""
                }`}
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

        {/* Vertical divider (desktop only) */}
        <div className="hidden self-stretch border-l border-[#e3c67c]/60 sm:block" />

        {/* Multiplier */}
        <div className="sm:w-[190px]">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a6821f] sm:text-xs">
              Multiplier
            </span>
            <Zap className="h-3.5 w-3.5 text-[#d8a72b]" fill="currentColor" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {X_DATA.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveX(i);
                  setMultiplier(item);
                }}
                className={`rounded-lg px-2 py-2 text-[11px] font-black transition sm:text-xs ${
                  activeX === i
                    ? "bg-[linear-gradient(135deg,#fff0a5,#d89a17)] text-[#3a2909] shadow-md"
                    : "border border-[#e3c67c]/70 bg-white text-[#7c6329] hover:bg-[#fff7e0]"
                }`}
              >
                X{item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Big / Small ===== */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setActiveBigSmall("l");
            selectBetHandle("l");
          }}
          className={`relative flex items-center justify-center gap-1.5 overflow-hidden rounded-xl py-3.5 text-sm font-black shadow-md transition hover:-translate-y-0.5 sm:text-base ${
            activeBigSmall === "l"
              ? "bg-[linear-gradient(135deg,#ffe48a,#d59a18)] text-[#382607]"
              : "border border-[#e3c67c]/70 bg-white text-[#7c6329]"
          }`}
        >
          Big <span className="text-[11px] opacity-70">5–9</span>
          <Crown
            className={`absolute right-3 h-5 w-5 ${
              activeBigSmall === "l" ? "text-[#a6721b]/60" : "text-[#e3c67c]/60"
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveBigSmall("n");
            selectBetHandle("n");
          }}
          className={`relative flex items-center justify-center gap-1.5 overflow-hidden rounded-xl py-3.5 text-sm font-black shadow-md transition hover:-translate-y-0.5 sm:text-base ${
            activeBigSmall === "n"
              ? "bg-[linear-gradient(135deg,#ffe48a,#d59a18)] text-[#382607]"
              : "border border-[#e3c67c]/70 bg-white text-[#7c6329]"
          }`}
        >
          Small <span className="text-[11px] opacity-70">0–4</span>
          <Crown
            className={`absolute right-3 h-5 w-5 ${
              activeBigSmall === "n" ? "text-[#a6721b]/60" : "text-[#e3c67c]/60"
            }`}
          />
        </button>
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
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-lg font-black shadow-sm ${getColorClass(
                    item.amount,
                    "text",
                  )} bg-white`}
                >
                  {item.amount}
                </span>
              </div>
              <div className="col-span-3 text-center">
                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-black ${
                    item.amount > 4
                      ? "bg-[#fff0bd] text-[#9a6a0d]"
                      : "bg-[#f1eadb] text-[#78644a]"
                  }`}
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
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                          item.amount === n
                            ? "active bg-[#d79b1c] text-white shadow-md"
                            : "border border-[#e4d5b3] text-[#b5a27f]"
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`third shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                      item.amount > 4
                        ? "bg-[#fff0bd] text-[#9a6a0d]"
                        : "bg-[#f0eadf] text-[#78644a]"
                    }`}
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
          <Link
            className="rounded-full border border-[#d1a13b] px-3 py-1 text-[10px] font-black text-[#8a620f]"
            to="#"
          >
            Details
          </Link>
        </div>
        {wingoHistoryData?.gameslist?.length === 0 ? (
          <EmptyData />
        ) : (
          (wingoHistoryData?.data?.gameslist || []).map((item, i) => (
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
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[9px] font-black shadow-sm ${getBetClass(
                      item.bet,
                    )}`}
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
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${
                        item.status === 1
                          ? "border-green-500 text-green-600"
                          : "border-red-400 text-red-500"
                      }`}
                    >
                      {item.status === 1 ? "Succeed" : "Failed"}
                    </span>
                    <p
                      className={`mt-1 text-xs font-black ${
                        item.status === 1 ? "text-green-600" : "text-red-500"
                      }`}
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
                      `₹${Number(item.money).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}`,
                    ],
                    ["Tax", `₹${item.fee}`],
                    ["Result", item.result],
                    ["Select", getBetLabel(item.bet)],
                    ["Status", item.status === 1 ? "Succeed" : "Failed"],
                    [
                      "Win/Loss",
                      `${item.status === 1 ? "+" : "-"}₹${Number(
                        item.status === 1 ? item.get : item.money,
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}`,
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
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          pageto / 10 >= 2
            ? "border-[#d4a237] bg-[#fff4cf] text-[#805a17] hover:bg-[#f7e7bb]"
            : "border-[#e5dbc5] bg-[#f7f3ea] text-[#c9c0ae]"
        }`}
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
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
          wingoPeriodListData?.page > pageto / 10
            ? "border-[#d4a237] bg-[#fff4cf] text-[#805a17] hover:bg-[#f7e7bb]"
            : "border-[#e5dbc5] bg-[#f7f3ea] text-[#c9c0ae]"
        }`}
        disabled={!(wingoPeriodListData?.page > pageto / 10)}
        onClick={handleIncrease}
      >
        <IoIosArrowForward />
      </button>
    </div>
  );

  // ============================================================
  // RENDER - MAIN
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
      {/* ====== BET POPUP ====== */}
      {openPopup && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpenPopup(false)}
          />
          <div className="fixed bottom-[76px] left-1/2 z-50 w-[calc(100%-16px)] max-w-[500px] -translate-x-1/2 overflow-hidden rounded-t-[26px] border border-[#d9aa3d]/60 bg-[#fffaf0] shadow-[0_-10px_40px_rgba(122,82,10,.12)]">
            <div
              className={`p-4 text-center ${getBetClass(
                selectBet,
              )} popup-select-effect`}
            >
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-black/65">
                Win Go {activeTime === 10 ? "30s" : `${activeTime}Min`}
              </p>
              <h2 className="mt-1 text-xl font-black text-black">
                Select {getBetLabel(selectBet)}
              </h2>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-4 bg-white">
              <div className="flex items-center justify-between gap-3 text-[#3b2b13]">
                <span className="text-sm font-bold">Balance</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {BALANCE_OPTIONS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                        balance === val
                          ? `${getBetClass(selectBet)} text-black shadow-md`
                          : "border border-[#e3c67c]/60 bg-[#fff7e0] text-[#7c6329]"
                      }`}
                      onClick={() => setBalance(val)}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-[#3b2b13]">
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
                    className="h-9 w-16 rounded-lg border border-[#e3c67c]/60 bg-white text-center font-black text-[#3b2b13] outline-none"
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
                    className={`rounded-lg py-2 text-[10px] font-black ${
                      activeX === i
                        ? `${getBetClass(selectBet)} text-black shadow-md`
                        : "border border-[#e3c67c]/60 bg-[#fff7e0] text-[#7c6329]"
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

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-[#5b4321]">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                  className="h-4 w-4 accent-yellow-400"
                />
                <span>I agree</span>
                <span className="font-bold text-[#b8801a]">Pre-sale rules</span>
              </label>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOpenPopup(false)}
                  className="group relative overflow-hidden rounded-xl border border-[#d9aa3d]/50 bg-[#f6ebcf] py-3.5 text-sm font-extrabold text-[#7c6329] shadow-sm transition-all duration-200 hover:bg-[#f0e0b8] active:scale-[.97]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-base opacity-70">✕</span>
                    Cancel
                  </span>
                </button>

                <button
                  type="button"
                  disabled={loader || !isChecked}
                  onClick={handleBet}
                  className="group relative overflow-hidden rounded-xl border border-[#f5cf68]/70 bg-gradient-to-b from-[#ffe58a] via-[#e0ad2d] to-[#b97908] py-3.5 text-sm font-black text-[#2b1b03] shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_5px_16px_rgba(201,148,29,.28)] transition-all duration-200 hover:brightness-105 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale-[.2]"
                >
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
      {/* ====== HOW TO PLAY POPUP ====== */}

      {openHowtoPlay && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setHowtoPlay(false)}
          />

          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#D9AA3D]/60 bg-white shadow-[0_15px_50px_rgba(122,82,10,.2)]">
            <div className="bg-gradient-to-br from-[#FFF8D6] via-[#FFE98A] to-[#D99A18] px-4 py-4 text-center border-b border-[#D9AA3D]/30">
              <h3 className="text-lg font-black text-[#2F2208]">
                How to Play — Win Go
              </h3>
              <p className="mt-0.5 text-xs font-semibold text-[#6B4D0B]">
                {activeTime === 10 ? "30s" : `${activeTime}Min`}
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto bg-white p-5 text-sm leading-7 text-[#30281B]">
              <div className="[&_p]:mb-3 [&_strong]:font-extrabold [&_strong]:text-[#2F2208] [&_li]:mb-2 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-black [&_h3]:text-[#5A410C]">
                {getHowToPlayContent()}
              </div>
            </div>

            <div className="border-t border-[#D9AA3D]/20 bg-[#FFFDF7] p-3">
              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] px-6 py-2.5 text-sm font-black text-[#2F2208] shadow-[0_3px_8px_rgba(210,145,0,.3)]"
                onClick={() => setHowtoPlay(false)}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ====== RESULT POPUP - ONLY SHOW IF USER HAS BET ====== */}
      {resultPopup && winResult !== null && hasUserBet && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-28px)] max-w-[390px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-[#d9aa3d]/60 bg-white p-5 text-center shadow-[0_10px_40px_rgba(122,82,10,.15)]">
            <img
              src={winResult ? WinImg : LoseImg}
              alt="result"
              className="mx-auto h-auto max-h-32 w-auto max-w-[80%] object-contain"
            />
            <p
              className={`mt-3 text-2xl font-black ${
                winResult ? "text-[#c9941f]" : "text-[#8a5c0b]"
              }`}
            >
              {winResult ? "Congratulations!" : "Better Luck Next Time"}
            </p>

            {/* Result Display */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[#9a8257]">Result</span>

              {(() => {
                // Try multiple possible paths for result
                const resultValue =
                  wingoHistoryData?.data?.gameslist?.[0]?.result ??
                  wingoHistoryData?.gameslist?.[0]?.result ??
                  null;

                const resultNum =
                  resultValue !== null && resultValue !== undefined
                    ? Number(resultValue)
                    : null;

                if (resultNum === null || isNaN(resultNum)) {
                  return (
                    <span className="rounded-full px-3 py-1 font-black text-white bg-[#9a8257]">
                      --
                    </span>
                  );
                }

                // Determine color
                let colorClass = "bg-gray-600";
                let colorName = "";

                if (resultNum === 0 || resultNum === 5) {
                  colorClass = resultNum === 0 ? "bg-red-600" : "bg-green-600";
                  colorName = resultNum === 0 ? "Red" : "Green";
                } else if ([1, 3, 7, 9].includes(resultNum)) {
                  colorClass = "bg-green-600";
                  colorName = "Green";
                } else if ([2, 4, 6, 8].includes(resultNum)) {
                  colorClass = "bg-red-600";
                  colorName = "Red";
                }

                return (
                  <>
                    <span
                      className={`rounded-full px-3 py-1 font-black text-white ${colorClass}`}
                    >
                      {colorName}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-black text-white ${
                        winResult ? "bg-[#d99a18]" : "bg-gray-600"
                      }`}
                    >
                      {resultNum}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-black text-white ${
                        resultNum > 4 ? "bg-[#d99a18]" : "bg-gray-600"
                      }`}
                    >
                      {resultNum > 4 ? "Big" : "Small"}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Period Display */}
            <p className="mt-4 text-[10px] text-[#9a8257]">
              Period:{" "}
              {wingoHistoryData?.data?.gameslist?.[0]?.stage ||
                wingoHistoryData?.gameslist?.[0]?.stage ||
                wingoHistoryData?.data?.gameslist?.[0]?.period ||
                wingoHistoryData?.gameslist?.[0]?.period ||
                "Loading..."}
            </p>

            <button
              type="button"
              className="mt-4 rounded-full border border-[#d9aa3d]/50 bg-[#fffaf0] px-6 py-2 text-xs font-black text-[#7c6329] hover:bg-[#f6ebcf] transition"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </>
      )}
      {/* ====== SUCCESS POPUP ====== */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
          <div className="animate-in fade-in zoom-in duration-300 rounded-xl border border-[#d9aa3d]/70 bg-white p-5 shadow-[0_8px_32px_rgba(122,82,10,.16)] text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl text-[#c9941f]">✓</span>
              <div className="text-left">
                <h3 className="text-base font-black text-[#3b2b13]">
                  Bet Placed Successfully
                </h3>
                <p className="text-[10px] text-[#9a8257] mt-0.5">
                  Your bet has been placed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== FINAL COUNTDOWN OVERLAY ====== */}
      {showCountdownOverlay && countdownNumber > 0 && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="animate-in fade-in duration-200 flex items-center justify-center">
            <span
              className="text-9xl font-black text-[#FFD75A] drop-shadow-lg tracking-wide"
              style={{
                textShadow:
                  "0 0 30px rgba(255, 215, 90, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4)",
              }}
            >
              {countdownNumber}
            </span>
          </div>
        </div>
      )}

      {/* ====== BET ALERT ====== */}
      <div className={`place-bet-popup ${betAlert ? "active" : ""}`}>
        <div className="text-sm font-bold">{messages}</div>
      </div>
    </>
  );
};

export default Wingo;
