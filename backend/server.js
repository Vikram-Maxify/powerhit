require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dns = require("dns");
const path = require("path");
const http = require("http");

// =====================================================
// DNS
// =====================================================
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// =====================================================
// DATABASE
// =====================================================
const connectDB = require("./config/connectdb");

// =====================================================
// MODELS
// =====================================================
const User = require("./models/authmodel");
const Wingo = require("./models/Wingo");
const Bet = require("./models/Bet");
const Transaction = require("./models/Transaction");
const Commission = require("./models/Commission");
const Subordinate = require("./models/Subordinate");
const Admin = require("./models/Admin");
const Level = require("./models/Level");
const Recharge = require("./models/Recharge");

// =====================================================
// BET CONTROLLER
// =====================================================
const betController = require("./controllers/betController");
const betRoutes = require("./routes/betRoutes");

// =====================================================
// USER ROUTES
// =====================================================
const authRoutes = require("./routes/authRoutes");
const dailyClaimRoutes = require("./routes/dailyClaimRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const depositRoutes = require("./routes/depositRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const publicBidRoutes = require("./routes/publicBidRoutes");
const marketRoutes = require("./routes/marketRoutes");
const bidRoutes = require("./routes/bidRoutes");
const resultRoutes = require("./routes/resultRoutes");
const currencyRateRoutes = require("./routes/currencyRateRoutes");
const userTicketTypeRoutes = require("./routes/user/ticketTypeRoutes");
const bettingBonusRoutes = require("./routes/bettingBonusRoutes");
const userGameEntryRoutes = require("./routes/user/gameEntryRoutes");
const userGameCountRoutes = require("./routes/user/gameCountRoutes");
const mineGameRoutes = require("./routes/minesRoutes");
const adminWithdrawalRoutes = require("./routes/admin/withdrawalRoutes");
const depositSettingsRoutes = require("./routes/depositSettingsRoutes");
const withdrawalSettingsRoutes = require("./routes/withdrawalSettingsRoutes");
const adminTicketTypeRoutes = require("./routes/admin/ticketTypeRoutes");
const winMultiplierRoutes = require("./routes/winMultiplierRoutes");
const adminGameCountRoutes = require("./routes/admin/gameCountRoutes");
const adminGameEntryRoutes = require("./routes/admin/gameEntryRoutes");
const adminPowerballResultRoutes = require("./routes/admin/powerballResultRoutes");
const adminPowerballDivisionRoutes = require("./routes/admin/powerballDivisionRoutes");

// =====================================================
// SOCKET.IO
// =====================================================
const socket = require("./config/socket");

// =====================================================
// APP
// =====================================================
const app = express();
const server = http.createServer(app);

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================
const io = socket.init(server);
app.set("io", io);
global.io = io;

// =====================================================
// CORS
// =====================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
  "https://control.codemax.shop",
];

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (allowedOrigins.includes(origin) || isLocalhost) {
    return callback(null, true);
  }
  console.warn("❌ CORS blocked:", origin);
  return callback(new Error("CORS origin not allowed"));
};

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires"],
  optionsSuccessStatus: 204
}));

app.options("*path", cors());

// =====================================================
// BODY PARSER
// =====================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// =====================================================
// NO CACHE FOR API
// =====================================================
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// =====================================================
// ROUTES
// =====================================================
app.use("/api", betRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/daily-claim", dailyClaimRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/public-bids", publicBidRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/currency", currencyRateRoutes);
app.use("/api/user/ticket-types", userTicketTypeRoutes);
app.use("/api/win-multipliers", winMultiplierRoutes);
app.use("/api/betting-bonus", bettingBonusRoutes);
app.use("/api/:country/game-entry", userGameEntryRoutes);
app.use("/api/:country/game-counts", userGameCountRoutes);
app.use("/api/mine-games", mineGameRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api", depositSettingsRoutes);
app.use("/api/withdrawal-settings", withdrawalSettingsRoutes);
app.use("/api/admin/ticket-types", adminTicketTypeRoutes);
app.use("/api/admin/:country/game-count", adminGameCountRoutes);
app.use("/api/admin/:country/game-entries", adminGameEntryRoutes);
app.use("/api/admin/:country/powerball-results", adminPowerballResultRoutes);
app.use("/api/admin/:country/powerball/divisions", adminPowerballDivisionRoutes);
app.use("/api/public/:country/powerball-results", require("./routes/user/powerballpublicresult"));
app.use("/api/admin/referral-levels", require("./routes/referralLevelRoutes"));
app.use("/api", require("./routes/TradebetRoute"));
app.use("/api/admin/bet-admin", require("./routes/TradeadminRoute"));

// =====================================================
// HEALTH CHECK
// =====================================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running with MongoDB",
    port: PORT,
    timestamp: new Date(),
    socket: {
      enabled: true,
      type: "Socket.IO",
      nativeWebSocket: false,
      path: socket.SOCKET_PATH,
    },
    games: {
      "30s": "wingo10",
      "1m": "wingo",
      "3m": "wingo3",
      "5m": "wingo5",
      trx: "trx",
    },
  });
});

// =====================================================
// FRONTEND
// =====================================================
const userDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(userDistPath));

const adminDistPath = path.join(__dirname, "../admin/dist");
app.use("/admin", express.static(adminDistPath));
app.get("/admin/{*path}", (req, res) => {
  res.sendFile(path.join(adminDistPath, "index.html"));
});
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(userDistPath, "index.html"));
});

// =====================================================
// 404 & ERROR HANDLER
// =====================================================
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

// =====================================================
// SOCKET TIMER STATE
// =====================================================
let currentTimers = {
  timeUpdate_30: { minute: 0, secondtime1: 0, secondtime2: 0 },
  timeUpdate_20: { minute: 0, secondtime1: 0, secondtime2: 0, countdown: 0, cycleSecond: 0, timestamp: 0, nextRoundAt: 0 },
  timeUpdate_11: { minute: 0, secondtime1: 0, secondtime2: 0 },
  timeUpdate_3: { minute: 0, secondtime1: 0, secondtime2: 0 },
  timeUpdate_5: { minute: 0, secondtime1: 0, secondtime2: 0 },
};

let lastResults = { wingo10: null, wingo: null, wingo3: null, wingo5: null, trx: null };
const processedPeriods = { wingo10: null, wingo: null, wingo3: null, wingo5: null, trx: null };
const emittedPeriods = { wingo10: null, wingo: null, wingo3: null, wingo5: null, trx: null };
const lastTimerBoundary = { wingo10: null, wingo: null, wingo3: null, wingo5: null };

// =====================================================
// TIMER CALCULATOR
// =====================================================
function calculateTimer(intervalSeconds) {
  const now = new Date();
  const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let remaining = intervalSeconds - (totalSeconds % intervalSeconds);
  if (remaining === 0) remaining = intervalSeconds;
  const minute = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return {
    minute,
    secondtime1: Math.floor(seconds / 10),
    secondtime2: seconds % 10,
  };
}

// =====================================================
// TRADING 30 SECOND CLOCK
// =====================================================
const TRADING_ROUND_SECONDS = 30;

function getTradingClock() {
  const nowMs = Date.now();
  const unixSeconds = Math.floor(nowMs / 1000);
  const cycleSecond = unixSeconds % TRADING_ROUND_SECONDS;
  const countdown = TRADING_ROUND_SECONDS - cycleSecond;
  return {
    minute: Math.floor(countdown / 60),
    secondtime1: Math.floor((countdown % 60) / 10),
    secondtime2: countdown % 10,
    countdown,
    cycleSecond,
    timestamp: nowMs,
    nextRoundAt: nowMs + countdown * 1000,
  };
}

// =====================================================
// PROCESS RESULT
// =====================================================
async function processResultImmediately(gameName, typeId) {
  try {
    const winGoNow = await Wingo.findOne({ status: 0, game: gameName }).sort({ _id: -1 }).limit(1);
    if (!winGoNow) {
      console.log(`[${gameName}] No pending period found`);
      return;
    }

    const period = String(winGoNow.period);
    console.log(`[${gameName}] Attempting atomic processing: ${period}`);

    const resultAmount = Number(betController.generateRandomResult());
    const finalResult = Number.isInteger(resultAmount) && resultAmount >= 0 && resultAmount <= 9
      ? resultAmount
      : Math.floor(Math.random() * 10);

    console.log(`[${gameName}] Generated result: ${period} -> ${finalResult}`);

    const updateResult = await Wingo.updateOne(
      { _id: winGoNow._id, status: 0, game: gameName },
      { $set: { amount: finalResult, status: 1 } }
    );

    if (updateResult.modifiedCount !== 1) {
      console.log(`[${gameName}] Period ${period} already processed. SKIP.`);
      return;
    }

    console.log(`[${gameName}] LOCKED/PROCESSED: ${period} -> ${finalResult}`);

    const newPeriod = String(BigInt(period) + BigInt(1));
    const existingNext = await Wingo.findOne({ game: gameName, period: newPeriod });
    if (!existingNext) {
      await Wingo.create({
        period: newPeriod,
        amount: 0,
        game: gameName,
        status: 0,
        hashvalue: require("crypto").randomBytes(5).toString("hex"),
        blocs: 50,
        time: new Date().toISOString(),
      });
      console.log(`[${gameName}] New period created: ${newPeriod}`);
    }

    await Admin.updateOne({}, { $set: { [gameName]: "-1" } });
    await betController.handlingWinGo1P(typeId);

    if (emittedPeriods[gameName] === period) {
      console.log(`[${gameName}] Period ${period} already emitted. SKIP emit.`);
      return;
    }

    emittedPeriods[gameName] = period;
    const resultData = { game: gameName, period: period, amount: finalResult };
    lastResults[gameName] = resultData;

    io.emit("data-server", { data: [resultData] });
    console.log(`[${gameName}] RESULT EMITTED: ${period} -> ${finalResult}`);
  } catch (error) {
    console.error(`[${gameName}] processResultImmediately ERROR:`, error);
  }
}

// =====================================================
// REAL-TIME TRADING CANDLE STREAM
// =====================================================
const CANDLE_INTERVAL_MS = 10 * 1000;
let liveCandle = null;
let liveCandleStart = 0;
let livePrice = 1.44634;
let candleHistory = [];

function createLiveCandle(now = Date.now()) {
  const start = Math.floor(now / CANDLE_INTERVAL_MS) * CANDLE_INTERVAL_MS;
  liveCandleStart = start;
  livePrice = Number(livePrice.toFixed(5));

  liveCandle = {
    x: new Date(start).toISOString(),
    open: livePrice,
    high: livePrice,
    low: livePrice,
    close: livePrice,
  };
}

function broadcastCandle() {
  const now = Date.now();

  if (!liveCandle || now >= liveCandleStart + CANDLE_INTERVAL_MS) {
    if (liveCandle) {
      candleHistory.push({ ...liveCandle });
      if (candleHistory.length > 500) candleHistory.shift();
      livePrice = liveCandle.close;
    }
    createLiveCandle(now);
  }

  const delta = (Math.random() - 0.5) * 0.00020;
  livePrice = Number(Math.max(0.00001, livePrice + delta).toFixed(5));

  liveCandle.close = livePrice;
  liveCandle.high = Number(Math.max(liveCandle.high, livePrice).toFixed(5));
  liveCandle.low = Number(Math.min(liveCandle.low, livePrice).toFixed(5));

  io.emit("candleUpdate", {
    history: candleHistory.slice(-100),
    candle: { ...liveCandle },
    timestamp: now,
    interval: CANDLE_INTERVAL_MS,
  });
}

// =====================================================
// BROADCAST TIMERS
// =====================================================
function broadcastTimers() {
  const timers = {
    timeUpdate_30: calculateTimer(30),
    timeUpdate_20: getTradingClock(),
    timeUpdate_11: calculateTimer(60),
    timeUpdate_3: calculateTimer(180),
    timeUpdate_5: calculateTimer(300),
  };

  currentTimers = timers;

  io.emit("timeUpdate_30", timers.timeUpdate_30);
  io.emit("timeUpdate_20", timers.timeUpdate_20);
  io.emit("timeUpdate_11", timers.timeUpdate_11);
  io.emit("timeUpdate_3", timers.timeUpdate_3);
  io.emit("timeUpdate_5", timers.timeUpdate_5);

  const now = new Date();
  const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const gameConfigs = [
    { name: "wingo10", interval: 30, type: 10 },
    { name: "wingo", interval: 60, type: 1 },
    { name: "wingo3", interval: 180, type: 3 },
    { name: "wingo5", interval: 300, type: 5 },
  ];

  for (const config of gameConfigs) {
    if (totalSeconds % config.interval !== 0) continue;
    const boundary = Math.floor(totalSeconds / config.interval);
    if (lastTimerBoundary[config.name] === boundary) continue;
    lastTimerBoundary[config.name] = boundary;

    console.log(`[TIMER] ${config.name} completed exactly. Processing result now.`);
    processResultImmediately(config.name, config.type).catch((error) => {
      console.error(`[TIMER] ${config.name} result processing error:`, error);
    });
  }
}

// =====================================================
// DATABASE + SERVER
// =====================================================
const PORT = Number(process.env.PORT) || 5007;

const startServer = async () => {
  try {
    await connectDB();
    console.log("[DATABASE] MongoDB connected");

    const adminExists = await Admin.findOne();
    if (!adminExists) {
      await Admin.create({
        wingo: "-1",
        wingo10: "-1",
        trx: "-1",
        wingo1_mode: 0,
        wingo30_mode: 0,
        trx_mode: 0,
        commition_Bet_Amount: 0,
        user_bet_commition: 0,
      });
      console.log("Admin settings initialized");
    }

    const levelCount = await Level.countDocuments();
    if (levelCount === 0) {
      const levels = [];
      for (let i = 1; i <= 6; i++) {
        levels.push({ level: i, f1: i * 2 });
      }
      await Level.insertMany(levels);
      console.log("Levels initialized");
    }

    const games = ["wingo", "wingo10", "trx", "wingo3", "wingo5"];
    for (const game of games) {
      const existing = await Wingo.findOne({ game, status: 0 });
      if (!existing) {
        const initialPeriod = Date.now().toString().slice(-8);
        await Wingo.create({
          period: initialPeriod,
          amount: 0,
          game: game,
          status: 0,
          hashvalue: require("crypto").randomBytes(5).toString("hex"),
          blocs: 50,
          time: new Date().toISOString(),
        });
        console.log(`Initial period created for ${game}`);
      }
    }

    if (typeof betController.setIo === "function") {
      betController.setIo(io);
    }

    setTimeout(() => {
      broadcastTimers();
      broadcastCandle();
      console.log("[SOCKET.IO] Initial timers + candle broadcasted");
    }, 1000);

    setInterval(() => {
      broadcastTimers();
      broadcastCandle();
    }, 1000);

    console.log("[SOCKET.IO] Timer broadcast started - every 1 second");

    server.listen(PORT, "0.0.0.0", () => {
      console.log("======================================");
      console.log(`Server running on port ${PORT}`);
      console.log(`User:  http://localhost:${PORT}`);
      console.log(`Admin: http://localhost:${PORT}/admin`);
      console.log(`API:   http://localhost:${PORT}/api`);
      console.log(`Mines: http://localhost:${PORT}/api/mine-games`);
      console.log(`Bet:   http://localhost:${PORT}/bet`);
      console.log("Socket.IO: ENABLED");
      console.log(`Socket.IO path: ${socket.SOCKET_PATH}`);
      console.log("Trading Engine: enabled");
      console.log("Games: 30s (wingo10), 1m (wingo), 3m (wingo3), 5m (wingo5), TRX (trx)");
      console.log("Database: MongoDB");
      console.log("======================================");
    });

    let lastCommission = 0;
    setInterval(async () => {
      const now = Date.now();
      if (now - lastCommission >= 300000) {
        lastCommission = now;
        try {
          await betController.tradeCommission();
        } catch (error) {
          console.error("Commission cron error:", error);
        }
      }
    }, 1000);

    setTimeout(async () => {
      try {
        await betController.tradeCommission();
        console.log("Initial commission processed");
      } catch (error) {
        console.error("Initial commission error:", error);
      }
    }, 10000);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================
const gracefulShutdown = async (signal) => {
  console.log(`\n[SERVER] ${signal} received. Shutting down...`);
  try {
    server.close(async () => {
      console.log("[SERVER] HTTP server closed");
      await socket.close();
      console.log("[SERVER] Socket.IO closed");
      console.log("[SERVER] Shutdown complete");
      process.exit(0);
    });
  } catch (error) {
    console.error("[SERVER] Shutdown error:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});