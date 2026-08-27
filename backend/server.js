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
// DATABASE
// =====================================================

const connectDB = require("./config/connectdb");

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


// =====================================================
// GENERIC COUNTRY USER GAME ROUTES
// =====================================================

const userGameEntryRoutes =
  require("./routes/user/gameEntryRoutes");

const userGameCountRoutes =
  require("./routes/user/gameCountRoutes");


// =====================================================
// MINES GAME
// =====================================================

const mineGameRoutes =
  require("./routes/minesRoutes");


// =====================================================
// ADMIN ROUTES
// =====================================================

const adminWithdrawalRoutes =
  require("./routes/admin/withdrawalRoutes");

const depositSettingsRoutes =
  require("./routes/depositSettingsRoutes");

const withdrawalSettingsRoutes =
  require("./routes/withdrawalSettingsRoutes");

const adminTicketTypeRoutes =
  require("./routes/admin/ticketTypeRoutes");

const winMultiplierRoutes =
  require("./routes/winMultiplierRoutes");


// =====================================================
// GENERIC COUNTRY ADMIN ROUTES
// =====================================================

const adminGameCountRoutes =
  require("./routes/admin/gameCountRoutes");

const adminGameEntryRoutes =
  require("./routes/admin/gameEntryRoutes");

const adminPowerballResultRoutes =
  require("./routes/admin/powerballResultRoutes");

const adminPowerballDivisionRoutes =
  require("./routes/admin/powerballDivisionRoutes");


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

      // Server-to-server / Postman
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
          .test(origin);

      if (
        allowedOrigins.includes(origin) ||
        isLocalhost
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Socket.IO CORS origin not allowed")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],

    credentials: true,
  },
});


// Make Socket.IO available in controllers
app.set("io", io);


// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {

  console.log(
    `Socket connected: ${socket.id}`
  );


  // ===================================================
  // JOIN USER ROOM
  // ===================================================

  socket.on("join-user", (userId) => {

    if (!userId) {
      return;
    }

    const room = `user-${userId}`;

    socket.join(room);

    console.log(
      `Socket ${socket.id} joined ${room}`
    );
  });


  // ===================================================
  // JOIN ADMIN ROOM
  // ===================================================

  socket.on("join-admin", (adminId) => {

    // adminId optional
    socket.join("admin");

    console.log(
      `Socket ${socket.id} joined admin`
    );
  });


  // ===================================================
  // JOIN MINES GAME
  // ===================================================

  socket.on("join-mines-game", (gameId) => {

    if (!gameId) {
      return;
    }

    const room = `mines-${gameId}`;

    socket.join(room);

    console.log(
      `Socket ${socket.id} joined ${room}`
    );
  });


  // ===================================================
  // LEAVE MINES GAME
  // ===================================================

  socket.on("leave-mines-game", (gameId) => {

    if (!gameId) {
      return;
    }

    const room = `mines-${gameId}`;

    socket.leave(room);

    console.log(
      `Socket ${socket.id} left ${room}`
    );
  });


  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on("disconnect", (reason) => {

    console.log(
      `Socket disconnected: ${socket.id}`,
      reason
    );
  });

});


// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: (origin, callback) => {

      // Allow Postman / server-to-server
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
          .test(origin);

      if (
        allowedOrigins.includes(origin) ||
        isLocalhost
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin not allowed")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],

    optionsSuccessStatus: 204,
  })
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
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);


// =====================================================
// COOKIE
// =====================================================

app.use(cookieParser());


// =====================================================
// NO CACHE FOR API
// =====================================================

app.use("/api", (req, res, next) => {

  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );

  res.set(
    "Pragma",
    "no-cache"
  );

  res.set(
    "Expires",
    "0"
  );

  next();
});


// =====================================================
// USER ROUTES
// =====================================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);


// Daily Claim
app.use(
  "/api/daily-claim",
  dailyClaimRoutes
);


// Withdrawals
app.use(
  "/api/withdrawals",
  withdrawalRoutes
);


// Deposit
app.use(
  "/api/deposit",
  depositRoutes
);


// Banner
app.use(
  "/api/banner",
  bannerRoutes
);


// Public Bids
app.use(
  "/api/public-bids",
  publicBidRoutes
);


// =====================================================
// MARKET / BID / RESULT
// =====================================================

app.use(
  "/api/markets",
  marketRoutes
);

app.use(
  "/api/bids",
  bidRoutes
);

app.use(
  "/api/results",
  resultRoutes
);

app.use(
  "/api/currency",
  currencyRateRoutes
);


// =====================================================
// USER TICKET TYPES
// =====================================================

app.use(
  "/api/user/ticket-types",
  userTicketTypeRoutes
);


// =====================================================
// WIN MULTIPLIERS
// =====================================================

app.use(
  "/api/win-multipliers",
  winMultiplierRoutes
);


// =====================================================
// BETTING BONUS
// =====================================================

app.use(
  "/api/betting-bonus",
  bettingBonusRoutes
);


// =====================================================
// GENERIC COUNTRY USER GAME ROUTES
// =====================================================

// Example:
//
// /api/india/game-entry
// /api/uae/game-entry
// /api/nepal/game-entry
// /api/pakistan/game-entry
// /api/australia/game-entry
// /api/canada/game-entry

app.use(
  "/api/:country/game-entry",
  userGameEntryRoutes
);

app.use(
  "/api/:country/game-counts",
  userGameCountRoutes
);


// =====================================================
// MINES GAME
// =====================================================
//
// User:
//
// POST /api/mine-games/start
// POST /api/mine-games/:gameId/reveal
// POST /api/mine-games/:gameId/cashout
//
// Admin:
//
// GET /api/mine-games/admin/history
//

app.use(
  "/api/mine-games",
  mineGameRoutes
);


// =====================================================
// ADMIN ROUTES
// =====================================================


// Admin Withdrawals
app.use(
  "/api/admin/withdrawals",
  adminWithdrawalRoutes
);


// Deposit Settings
app.use(
  "/api",
  depositSettingsRoutes
);


// Withdrawal Settings
app.use(
  "/api/withdrawal-settings",
  withdrawalSettingsRoutes
);


// Admin Ticket Types
app.use(
  "/api/admin/ticket-types",
  adminTicketTypeRoutes
);


// =====================================================
// COUNTRY ADMIN GAME ROUTES
// =====================================================


// Game Count
app.use(
  "/api/admin/:country/game-count",
  adminGameCountRoutes
);


// Game Entries
app.use(
  "/api/admin/:country/game-entries",
  adminGameEntryRoutes
);


// Powerball Results
app.use(
  "/api/admin/:country/powerball-results",
  adminPowerballResultRoutes
);


// Powerball Divisions
app.use(
  "/api/admin/:country/powerball/divisions",
  adminPowerballDivisionRoutes
);


// =====================================================
// PUBLIC POWERBALL RESULTS
// =====================================================

app.use(
  "/api/public/:country/powerball-results",
  require("./routes/user/powerballpublicresult")
);


// =====================================================
// REFERRAL LEVELS
// =====================================================

app.use(
  "/api/admin/referral-levels",
  require("./routes/referralLevelRoutes")
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {

    res.status(200).json({
      success: true,
      message: "API is running",
      port: PORT,
      timestamp: new Date(),
    });

  }
);


// =====================================================
// USER FRONTEND
// =====================================================

const userDistPath =
  path.join(
    __dirname,
    "../client/dist"
  );

app.use(
  express.static(userDistPath)
);


// =====================================================
// ADMIN FRONTEND
// =====================================================

const adminDistPath =
  path.join(
    __dirname,
    "../admin/dist"
  );

app.use(
  "/admin",
  express.static(adminDistPath)
);


// =====================================================
// ADMIN SPA FALLBACK
// =====================================================

app.get(
  "/admin/{*path}",
  (req, res) => {

    res.sendFile(
      path.join(
        adminDistPath,
        "index.html"
      )
    );

  }
);


// =====================================================
// USER SPA FALLBACK
// =====================================================

app.get(
  "/{*path}",
  (req, res) => {

    res.sendFile(
      path.join(
        userDistPath,
        "index.html"
      )
    );

  }
);


// =====================================================
// 404 API HANDLER
// =====================================================

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({
      success: false,
      message: "API route not found",
      path: req.originalUrl,
    });

  }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    if (res.headersSent) {
      return next(err);
    }

    res.status(
      err.status || 500
    ).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });

  }
);


// =====================================================
// DATABASE + SERVER
// =====================================================

const PORT =
  Number(process.env.PORT) || 5007;


const startServer = async () => {

  try {

    await connectDB();

    server.listen(
      PORT,
      () => {

        console.log(
          "======================================"
        );

        console.log(
          `Server running on port ${PORT}`
        );

        console.log(
          `User:  http://localhost:${PORT}`
        );

        console.log(
          `Admin: http://localhost:${PORT}/admin`
        );

        console.log(
          `API:   http://localhost:${PORT}/api`
        );

        console.log(
          `Mines: http://localhost:${PORT}/api/mine-games`
        );

        console.log(
          "Socket.IO: enabled"
        );

        console.log(
          "======================================"
        );

      }
    );

  } catch (error) {

    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);

  }

};


startServer();


// =====================================================
// PROCESS ERROR HANDLING
// =====================================================

process.on(
  "unhandledRejection",
  (error) => {

    console.error(
      "Unhandled Rejection:",
      error
    );

  }
);

process.on(
  "uncaughtException",
  (error) => {

    console.error(
      "Uncaught Exception:",
      error
    );

  }
);