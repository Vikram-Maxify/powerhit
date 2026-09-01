// tradingSocket.js

const TradingRound = require("../models/TradingRound");
const { resolveTrades } = require("../controllers/tradingController");

const DEFAULT_PRICE = 107960;
const ROUND_DURATION_MS = 60 * 1000;

let engineStarted = false;
let timer = null;
let io = null;

let currentPrice = DEFAULT_PRICE;

// =====================================================
// ROUND ID
// =====================================================

function makeRoundId() {
  return `TR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// =====================================================
// ENSURE ACTIVE ROUND
// =====================================================

async function ensureRound() {
  try {
    // IMPORTANT:
    // Only check status here.
    // Do NOT check endsAt because tick() needs
    // to detect and complete an expired round.

    let round = await TradingRound.findOne({
      status: "active",
    }).sort({ createdAt: -1 });

    if (!round) {
      const now = new Date();

      round = await TradingRound.create({
        roundId: makeRoundId(),

        startValue: currentPrice,

        currentValue: currentPrice,

        status: "active",

        startsAt: now,

        endsAt: new Date(now.getTime() + ROUND_DURATION_MS),
      });

      console.log(`[TRADING] New round created: ${round.roundId}`);
    }

    currentPrice = Number(round.currentValue);

    return round;
  } catch (error) {
    console.error("[TRADING] ENSURE ROUND ERROR:", error);

    throw error;
  }
}

// =====================================================
// RANDOM PRICE MOVEMENT
// =====================================================

function randomNextPrice(value) {
  const maxMove = value * 0.0012;

  const movement = (Math.random() * 2 - 1) * maxMove;

  const nextValue = value + movement;

  return Math.max(1, nextValue);
}

// =====================================================
// COMPLETE ROUND
// =====================================================

async function completeCurrentRound(round) {
  try {
    // -----------------------------------------------
    // FINAL VALUE
    // -----------------------------------------------

    round.finalValue = Number(round.currentValue);

    round.status = "completed";

    await round.save();

    console.log(`[TRADING] Round completed: ${round.roundId}`);

    console.log(`[TRADING] Final value: ${round.finalValue}`);

    // -----------------------------------------------
    // RESOLVE TRADES
    // -----------------------------------------------

    try {
      await resolveTrades(round);

      console.log(`[TRADING] Trades resolved for ${round.roundId}`);
    } catch (error) {
      console.error("[TRADING] RESOLVE TRADES ERROR:", error);
    }

    // -----------------------------------------------
    // EMIT ROUND COMPLETED
    // -----------------------------------------------

    if (io) {
      io.emit("trading:completed", {
        roundId: round.roundId,

        finalValue: Number(round.finalValue.toFixed(2)),
      });
    }

    // -----------------------------------------------
    // CREATE NEXT ROUND
    // -----------------------------------------------

    const now = new Date();

    const nextStartValue = Number(round.finalValue);

    const nextRound = await TradingRound.create({
      roundId: makeRoundId(),

      startValue: nextStartValue,

      currentValue: nextStartValue,

      status: "active",

      startsAt: now,

      endsAt: new Date(now.getTime() + ROUND_DURATION_MS),
    });

    currentPrice = nextStartValue;

    console.log(`[TRADING] New round started: ${nextRound.roundId}`);

    // -----------------------------------------------
    // EMIT NEW ROUND
    // -----------------------------------------------

    if (io) {
      io.emit("trading:round", nextRound.toObject());

      // Send first value immediately
      io.emit("trading:value", {
        roundId: nextRound.roundId,

        value: Number(nextRound.currentValue.toFixed(2)),

        previousValue: Number(nextRound.currentValue.toFixed(2)),

        direction: "same",

        endsAt: nextRound.endsAt,

        status: nextRound.status,

        timestamp: Date.now(),
      });
    }

    return nextRound;
  } catch (error) {
    console.error("[TRADING] COMPLETE ROUND ERROR:", error);

    throw error;
  }
}

// =====================================================
// MAIN TICK
// =====================================================

async function tick() {
  try {
    // -----------------------------------------------
    // SOCKET CHECK
    // -----------------------------------------------

    if (!io) {
      console.error("[TRADING] Socket.IO instance not available");

      return;
    }

    // -----------------------------------------------
    // GET CURRENT ROUND
    // -----------------------------------------------

    let round = await ensureRound();

    const now = new Date();

    // -----------------------------------------------
    // CHECK ROUND EXPIRY
    // -----------------------------------------------

    if (round.status !== "active" || new Date(round.endsAt) <= now) {
      round = await completeCurrentRound(round);

      return;
    }

    // -----------------------------------------------
    // GENERATE NEW PRICE
    // -----------------------------------------------

    const previousValue = currentPrice;

    currentPrice = randomNextPrice(previousValue);

    // -----------------------------------------------
    // SAVE CURRENT PRICE
    // -----------------------------------------------

    round.currentValue = currentPrice;

    await round.save();

    // -----------------------------------------------
    // CALCULATE DIRECTION
    // -----------------------------------------------

    const delta = currentPrice - previousValue;

    let direction = "same";

    if (delta > 0) {
      direction = "up";
    } else if (delta < 0) {
      direction = "down";
    }

    // -----------------------------------------------
    // SOCKET PAYLOAD
    // -----------------------------------------------

    const payload = {
      roundId: round.roundId,

      value: Number(currentPrice.toFixed(2)),

      previousValue: Number(previousValue.toFixed(2)),

      direction,

      endsAt: round.endsAt,

      status: round.status,

      timestamp: Date.now(),
    };

    // -----------------------------------------------
    // EMIT LIVE VALUE
    // -----------------------------------------------

    io.emit("trading:value", payload);

    // -----------------------------------------------
    // SERVER LOG
    // -----------------------------------------------

    console.log(`[TRADING] ${round.roundId} | ${payload.value} | ${direction}`);
  } catch (error) {
    console.error("[TRADING] TICK ERROR:", error);
  }
}

// =====================================================
// INITIALIZE TRADING SOCKET
// =====================================================

function initTradingSocket(socketIo) {
  if (engineStarted) {
    console.log("[TRADING] Engine already started");

    return;
  }

  // -----------------------------------------------
  // VALIDATE SOCKET.IO
  // -----------------------------------------------

  if (!socketIo) {
    console.error("[TRADING] Socket.IO instance missing");

    return;
  }

  // -----------------------------------------------
  // SAVE IO INSTANCE
  // -----------------------------------------------

  io = socketIo;

  // -----------------------------------------------
  // SOCKET CONNECTION
  // -----------------------------------------------

  io.on("connection", async (socket) => {
    try {
      console.log(`[TRADING] Client connected: ${socket.id}`);

      const round = await ensureRound();

      // ---------------------------------------------
      // SEND CURRENT ROUND
      // ---------------------------------------------

      socket.emit("trading:round", round.toObject());

      // ---------------------------------------------
      // SEND CURRENT VALUE
      // ---------------------------------------------

      socket.emit("trading:value", {
        roundId: round.roundId,

        value: Number(round.currentValue),

        previousValue: Number(round.currentValue),

        direction: "same",

        endsAt: round.endsAt,

        status: round.status,

        timestamp: Date.now(),
      });

      console.log(`[TRADING] Initial trading data sent: ${socket.id}`);
    } catch (error) {
      console.error("[TRADING] CONNECTION ERROR:", error);

      socket.emit("trading:error", {
        message: "Failed to initialize trading data",
      });
    }
  });

  // -----------------------------------------------
  // FIRST TICK
  // -----------------------------------------------

  setTimeout(() => {
    tick();
  }, 100);

  // -----------------------------------------------
  // LIVE TICK EVERY SECOND
  // -----------------------------------------------

  timer = setInterval(() => {
    tick();
  }, 1000);

  engineStarted = true;

  console.log("[TRADING] Trading socket engine started successfully");
}

// =====================================================
// STOP TRADING SOCKET
// =====================================================

function stopTradingSocket() {
  if (timer) {
    clearInterval(timer);

    timer = null;
  }

  io = null;

  engineStarted = false;

  console.log("[TRADING] Trading socket engine stopped");
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  initTradingSocket,
  stopTradingSocket,
};
