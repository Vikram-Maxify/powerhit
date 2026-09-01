require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dns = require("dns");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// =====================================================
// DNS
// =====================================================

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// =====================================================
// DATABASE - MongoDB
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
const tradingRoutes = require("./routes/tradingRoutes");

const userTicketTypeRoutes = require("./routes/user/ticketTypeRoutes");

const bettingBonusRoutes = require("./routes/bettingBonusRoutes");

// =====================================================
// GENERIC COUNTRY USER GAME ROUTES
// =====================================================

const userGameEntryRoutes = require("./routes/user/gameEntryRoutes");
const userGameCountRoutes = require("./routes/user/gameCountRoutes");

// =====================================================
// MINES GAME
// =====================================================

const mineGameRoutes = require("./routes/minesRoutes");

// =====================================================
// ADMIN ROUTES
// =====================================================

const adminWithdrawalRoutes = require("./routes/admin/withdrawalRoutes");
const depositSettingsRoutes = require("./routes/depositSettingsRoutes");
const withdrawalSettingsRoutes = require("./routes/withdrawalSettingsRoutes");
const adminTicketTypeRoutes = require("./routes/admin/ticketTypeRoutes");
const winMultiplierRoutes = require("./routes/winMultiplierRoutes");

// =====================================================
// GENERIC COUNTRY ADMIN ROUTES
// =====================================================

const adminGameCountRoutes = require("./routes/admin/gameCountRoutes");
const adminGameEntryRoutes = require("./routes/admin/gameEntryRoutes");
const adminPowerballResultRoutes = require("./routes/admin/powerballResultRoutes");
const adminPowerballDivisionRoutes = require("./routes/admin/powerballDivisionRoutes");

// =====================================================
// TRADING SOCKET ENGINE
// =====================================================

const {
  initTradingSocket,
  stopTradingSocket,
} = require("./socket/tradingSocket");

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);

// =====================================================
// SOCKET.IO
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
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests without origin
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );

      if (allowedOrigins.includes(origin) || isLocalhost) {
        return callback(null, true);
      }

      return callback(new Error("Socket.IO CORS origin not allowed"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    credentials: true,
  },
});

// =====================================================
// MAKE SOCKET.IO AVAILABLE TO APP
// =====================================================

app.set("io", io);

// Keep global.io because other existing parts
// of your application may already use it.
global.io = io;

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id}`);

  // -----------------------------------------------
  // JOIN USER ROOM
  // -----------------------------------------------

  socket.on("join-user", (userId) => {
    if (!userId) return;

    const room = `user-${userId}`;

    socket.join(room);

    console.log(`[SOCKET] ${socket.id} joined ${room}`);
  });

  // -----------------------------------------------
  // JOIN ADMIN ROOM
  // -----------------------------------------------

  socket.on("join-admin", (adminId) => {
    socket.join("admin");

    console.log(`[SOCKET] ${socket.id} joined admin`);
  });

  // -----------------------------------------------
  // JOIN MINES GAME
  // -----------------------------------------------

  socket.on("join-mines-game", (gameId) => {
    if (!gameId) return;

    const room = `mines-${gameId}`;

    socket.join(room);

    console.log(`[SOCKET] ${socket.id} joined ${room}`);
  });

  // -----------------------------------------------
  // LEAVE MINES GAME
  // -----------------------------------------------

  socket.on("leave-mines-game", (gameId) => {
    if (!gameId) return;

    const room = `mines-${gameId}`;

    socket.leave(room);

    console.log(`[SOCKET] ${socket.id} left ${room}`);
  });

  // -----------------------------------------------
  // DISCONNECT
  // -----------------------------------------------

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] Disconnected: ${socket.id}`, reason);
  });
});

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );

      if (allowedOrigins.includes(origin) || isLocalhost) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],

    optionsSuccessStatus: 204,
  }),
);

// =====================================================
// PREFLIGHT
// =====================================================

app.options("*path", cors());

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// =====================================================
// COOKIE
// =====================================================

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
// BET ROUTES
// =====================================================

// Bet pages
app.get("/bet/wingo", betController.winGoPage);

app.get("/bet/wingo10", betController.winGoPage10);

app.get("/bet/trx", betController.trxPage);

// API routes
app.post("/api/bet", betController.betWinGo);

app.post("/api/order-list", betController.listOrderOld);

app.post("/api/my-bets", betController.GetMyEmerdList);

app.post("/api/commission-admin", betController.tradeCommissionadmin);

app.get("/api/commission-get", betController.tradeCommissionGet);

// =====================================================
// USER ROUTES
// =====================================================

// Authentication
app.use("/api/auth", authRoutes);

// Daily Claim
app.use("/api/daily-claim", dailyClaimRoutes);

// Withdrawals
app.use("/api/withdrawals", withdrawalRoutes);

// Deposit
app.use("/api/deposit", depositRoutes);

// Banner
app.use("/api/banner", bannerRoutes);

// Public Bids
app.use("/api/public-bids", publicBidRoutes);

// =====================================================
// MARKET / BID / RESULT
// =====================================================

app.use("/api/markets", marketRoutes);

app.use("/api/bids", bidRoutes);

app.use("/api/results", resultRoutes);

app.use("/api/currency", currencyRateRoutes);

// Trading API
app.use("/api/trading", tradingRoutes);

// =====================================================
// USER TICKET TYPES
// =====================================================

app.use("/api/user/ticket-types", userTicketTypeRoutes);

// =====================================================
// WIN MULTIPLIERS
// =====================================================

app.use("/api/win-multipliers", winMultiplierRoutes);

// =====================================================
// BETTING BONUS
// =====================================================

app.use("/api/betting-bonus", bettingBonusRoutes);

// =====================================================
// GENERIC COUNTRY USER GAME ROUTES
// =====================================================

app.use("/api/:country/game-entry", userGameEntryRoutes);

app.use("/api/:country/game-counts", userGameCountRoutes);

// =====================================================
// MINES GAME
// =====================================================

app.use("/api/mine-games", mineGameRoutes);

// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin Withdrawals
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);

// Deposit Settings
app.use("/api", depositSettingsRoutes);

// Withdrawal Settings
app.use("/api/withdrawal-settings", withdrawalSettingsRoutes);

// Admin Ticket Types
app.use("/api/admin/ticket-types", adminTicketTypeRoutes);

// =====================================================
// COUNTRY ADMIN GAME ROUTES
// =====================================================

// Game Count
app.use("/api/admin/:country/game-count", adminGameCountRoutes);

// Game Entries
app.use("/api/admin/:country/game-entries", adminGameEntryRoutes);

// Powerball Results
app.use("/api/admin/:country/powerball-results", adminPowerballResultRoutes);

// Powerball Divisions
app.use(
  "/api/admin/:country/powerball/divisions",
  adminPowerballDivisionRoutes,
);

// =====================================================
// PUBLIC POWERBALL RESULTS
// =====================================================

app.use(
  "/api/public/:country/powerball-results",
  require("./routes/user/powerballpublicresult"),
);

// =====================================================
// REFERRAL LEVELS
// =====================================================

app.use("/api/admin/referral-levels", require("./routes/referralLevelRoutes"));

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,

    message: "API is running with MongoDB - 30s & 1m games only",

    port: PORT,

    timestamp: new Date(),

    games: {
      "30s": "wingo10",
      "1m": "wingo",
      trx: "trx",
    },
  });
});

// =====================================================
// USER FRONTEND
// =====================================================

const userDistPath = path.join(__dirname, "../client/dist");

app.use(express.static(userDistPath));

// =====================================================
// ADMIN FRONTEND
// =====================================================

const adminDistPath = path.join(__dirname, "../admin/dist");

app.use("/admin", express.static(adminDistPath));

// =====================================================
// ADMIN SPA FALLBACK
// =====================================================

app.get("/admin/{*path}", (req, res) => {
  res.sendFile(path.join(adminDistPath, "index.html"));
});

// =====================================================
// USER SPA FALLBACK
// =====================================================

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(userDistPath, "index.html"));
});

// =====================================================
// 404 API HANDLER
// =====================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,

    message: "API route not found",

    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,

    message: err.message || "Internal server error",
  });
});

// =====================================================
// DATABASE + SERVER
// =====================================================

const PORT = Number(process.env.PORT) || 5007;

const startServer = async () => {
  try {
    // -----------------------------------------------
    // CONNECT TO MONGODB
    // -----------------------------------------------

    await connectDB();

    console.log("[DATABASE] MongoDB connected");

    // -----------------------------------------------
    // INITIALIZE ADMIN SETTINGS
    // -----------------------------------------------

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

    // -----------------------------------------------
    // INITIALIZE LEVELS
    // -----------------------------------------------

    const levelCount = await Level.countDocuments();

    if (levelCount === 0) {
      const levels = [];

      for (let i = 1; i <= 6; i++) {
        levels.push({
          level: i,
          f1: i * 2,
        });
      }

      await Level.insertMany(levels);

      console.log("Levels initialized");
    }

    // -----------------------------------------------
    // INITIAL GAME PERIODS
    // -----------------------------------------------

    const games = ["wingo", "wingo10", "trx"];

    for (const game of games) {
      const existing = await Wingo.findOne({
        game,
        status: 0,
      });

      if (!existing) {
        const initialPeriod = Date.now().toString().slice(-8);

        await Wingo.create({
          period: initialPeriod,

          amount: 0,

          game,

          status: 0,

          hashvalue: require("crypto").randomBytes(5).toString("hex"),

          blocs: 50,

          time: new Date().toISOString(),
        });

        console.log(`Initial period created for ${game}`);
      }
    }

    // =================================================
    // START TRADING SOCKET ENGINE
    // =================================================

    initTradingSocket(io);

    // =================================================
    // START SERVER
    // =================================================

    server.listen(PORT, "0.0.0.0", () => {
      console.log("======================================");

      console.log(`Server running on port ${PORT}`);

      console.log(`User:  http://localhost:${PORT}`);

      console.log(`Admin: http://localhost:${PORT}/admin`);

      console.log(`API:   http://localhost:${PORT}/api`);

      console.log(`Mines: http://localhost:${PORT}/api/mine-games`);

      console.log(`Bet:   http://localhost:${PORT}/bet`);

      console.log("Socket.IO: enabled");

      console.log("Trading Engine: enabled");

      console.log("Games: 30s (wingo10), 1m (wingo), TRX (trx)");

      console.log("Database: MongoDB");

      console.log("======================================");
    });

    // =================================================
    // CRON JOBS - 30s GAME
    // =================================================

    let lastRun30 = 0;

    setInterval(async () => {
      const now = Date.now();

      if (now - lastRun30 >= 30000) {
        lastRun30 = now;

        try {
          const period = await Wingo.findOne({
            status: 0,
            game: "wingo10",
          })
            .sort({
              _id: -1,
            })
            .limit(1);

          await betController.addWinGo_30(period?.period);

          await betController.handlingWinGo1P(10);
        } catch (error) {
          console.error("30s cron error:", error);
        }
      }
    }, 1000);

    // =================================================
    // CRON JOBS - 1 MINUTE GAME
    // =================================================

    let lastRun1 = 0;

    setInterval(async () => {
      const now = Date.now();

      if (now - lastRun1 >= 60000) {
        lastRun1 = now;

        try {
          const period = await Wingo.findOne({
            status: 0,
            game: "wingo",
          })
            .sort({
              _id: -1,
            })
            .limit(1);

          await betController.addWinGo_1(period?.period);

          await betController.handlingWinGo1P(1);
        } catch (error) {
          console.error("1m cron error:", error);
        }
      }
    }, 1000);

    // =================================================
    // CRON JOBS - TRX
    // =================================================

    let lastRunTrx = 0;

    setInterval(async () => {
      const now = Date.now();

      if (now - lastRunTrx >= 60000) {
        lastRunTrx = now;

        try {
          const period = await Wingo.findOne({
            status: 0,
            game: "trx",
          })
            .sort({
              _id: -1,
            })
            .limit(1);

          await betController.addWinGo_trx(period?.period);

          await betController.handlingWinGo1P(11);
        } catch (error) {
          console.error("TRX cron error:", error);
        }
      }
    }, 1000);

    // =================================================
    // COMMISSION PROCESSING
    // =================================================

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

    // =================================================
    // INITIAL COMMISSION
    // =================================================

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

// =====================================================
// START
// =====================================================

startServer();

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on("SIGINT", () => {
  console.log("\n[SERVER] Shutting down...");

  stopTradingSocket();

  server.close(() => {
    console.log("[SERVER] Server closed");

    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n[SERVER] SIGTERM received...");

  stopTradingSocket();

  server.close(() => {
    console.log("[SERVER] Server closed");

    process.exit(0);
  });
});

// =====================================================
// PROCESS ERROR HANDLING
// =====================================================

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
