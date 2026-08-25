require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dns = require("dns");
const path = require("path");

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = require("./config/connectdb");

// ============================================
// USER ROUTES IMPORTS
// ============================================
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

// ============================================
// GENERIC 6-COUNTRY USER GAME ROUTES
// ============================================
const userGameEntryRoutes = require("./routes/user/gameEntryRoutes");
const userGameCountRoutes = require("./routes/user/gameCountRoutes");

// ============================================
// ADMIN ROUTES IMPORTS
// ============================================
const adminWithdrawalRoutes = require("./routes/admin/withdrawalRoutes");
const depositSettingsRoutes = require("./routes/depositSettingsRoutes");
const withdrawalSettingsRoutes = require("./routes/withdrawalSettingsRoutes");
const adminTicketTypeRoutes = require("./routes/admin/ticketTypeRoutes");
const winMultiplierRoutes = require("./routes/winMultiplierRoutes");

// ============================================
// GENERIC 6-COUNTRY ADMIN ROUTES
// ============================================
const adminGameCountRoutes = require("./routes/admin/gameCountRoutes");
const adminGameEntryRoutes = require("./routes/admin/gameEntryRoutes");
const adminPowerballResultRoutes = require("./routes/admin/powerballResultRoutes");
const adminPowerballDivisionRoutes = require("./routes/admin/powerballDivisionRoutes");

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman/server-to-server and every local Vite port.
      if (!origin) return callback(null, true);

      const isLocalhost =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

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
  })
);

// Explicitly answer browser preflight requests before authentication/routes.
app.options("*path", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================
// USER ROUTES
// ============================================

// Authentication & Core
app.use("/api/auth", authRoutes);
app.use("/api/daily-claim", dailyClaimRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/public-bids", publicBidRoutes);

// Markets, Bids, Results
app.use("/api/markets", marketRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/currency", currencyRateRoutes);

// User Ticket Types
app.use("/api/user/ticket-types", userTicketTypeRoutes);

app.use("/api/win-multipliers", winMultiplierRoutes);

// ============================================
// GENERIC 6-COUNTRY USER GAME ROUTES
// ============================================
// Same routes work for:
// india, uae, nepal, pakistan, australia, canada
//
// Examples:
// /api/india/game-entry
// /api/uae/game-entry
// /api/nepal/game-counts
// /api/australia/game-counts
// ============================================
app.use("/api/:country/game-entry", userGameEntryRoutes);
app.use("/api/:country/game-counts", userGameCountRoutes);

// ============================================
// ADMIN ROUTES
// ============================================

// Core Admin
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);

app.use("/api", depositSettingsRoutes);

app.use("/api/withdrawal-settings", withdrawalSettingsRoutes);

app.use("/api/admin/ticket-types", adminTicketTypeRoutes);

// ============================================
// GENERIC 6-COUNTRY ADMIN GAME / POWERBALL
// Existing country-based admin URLs
// ============================================
app.use("/api/admin/:country/game-count", adminGameCountRoutes);
app.use("/api/admin/:country/game-entries", adminGameEntryRoutes);
app.use("/api/admin/:country/powerball-results", adminPowerballResultRoutes);
app.use(
  "/api/admin/:country/powerball/divisions",
  adminPowerballDivisionRoutes
);


app.use("/api/public/:country/powerball-results",require('./routes/user/powerballpublicresult'));


// ============================================
// REFERRAL LEVELS
// ============================================
app.use(
  "/api/admin/referral-levels",
  require("./routes/referralLevelRoutes")
);

// ============================================
// BETTING BONUS
// ============================================
app.use("/api/betting-bonus", bettingBonusRoutes);

// ============================================
// STATIC FILES & FRONTEND ROUTES
// ============================================

// User Frontend
app.use(
  express.static(path.join(__dirname, "../client/dist"))
);

// Admin Frontend
app.use(
  "/admin",
  express.static(path.join(__dirname, "../admin/dist"))
);

// ============================================
// SPA FALLBACK ROUTES
// ============================================

// Admin React Routes
app.get("/admin/{*path}", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../admin/dist/index.html")
  );
});

// User React Routes
app.get("/{*path}", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../client/dist/index.html")
  );
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
