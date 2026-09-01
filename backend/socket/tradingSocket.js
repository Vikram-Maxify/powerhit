// tradingSocket.js
const TradingRound = require("../models/TradingRound");
const { resolveTrades } = require("../controllers/tradingController");

const DEFAULT_PRICE = 107960;
const ROUND_DURATION_MS = 60 * 1000;

let engineStarted = false;
let timer = null;
let currentPrice = DEFAULT_PRICE;

function makeRoundId() {
  return `TR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function ensureRound() {
  try {
    let round = await TradingRound.findOne({
      status: "active",
      endsAt: { $gt: new Date() },
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
      console.log(`Created new trading round: ${round.roundId}`);
    }

    currentPrice = Number(round.currentValue);
    return round;
  } catch (error) {
    console.error("Error ensuring round:", error);
    throw error;
  }
}

function randomNextPrice(value) {
  const maxMove = value * 0.0012;
  const movement = (Math.random() * 2 - 1) * maxMove;
  return Math.max(1, value + movement);
}

async function tick() {
  try {
    // Get io from global
    const io = global.io;

    if (!io) {
      console.error("Socket.IO not initialized globally");
      return;
    }

    let round = await ensureRound();

    // Check if round is completed or expired
    if (round.status !== "active" || new Date(round.endsAt) <= new Date()) {
      // Complete current round
      round.finalValue = Number(round.currentValue);
      round.status = "completed";
      await round.save();

      // Resolve trades
      try {
        await resolveTrades(round);
      } catch (error) {
        console.error("Error resolving trades:", error);
      }

      // Emit completion event
      io.emit("trading:completed", {
        roundId: round.roundId,
        finalValue: round.finalValue,
      });

      // Create new round
      const now = new Date();
      round = await TradingRound.create({
        roundId: makeRoundId(),
        startValue: Number(round.finalValue),
        currentValue: Number(round.finalValue),
        status: "active",
        startsAt: now,
        endsAt: new Date(now.getTime() + ROUND_DURATION_MS),
      });

      currentPrice = Number(round.currentValue);

      // Emit new round
      io.emit("trading:round", round.toObject());
      console.log(`New trading round started: ${round.roundId}`);
      return;
    }

    // Update price
    const previousValue = currentPrice;
    currentPrice = randomNextPrice(currentPrice);

    round.currentValue = currentPrice;
    await round.save();

    const delta = currentPrice - previousValue;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "same";

    // Emit price update
    io.emit("trading:value", {
      roundId: round.roundId,
      value: Number(currentPrice.toFixed(2)),
      previousValue: Number(previousValue.toFixed(2)),
      direction,
      endsAt: round.endsAt,
      status: round.status,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("TRADING SOCKET TICK ERROR:", error);
  }
}

function initTradingSocket() {
  if (engineStarted) {
    console.log("Trading engine already started");
    return;
  }

  const io = global.io;

  if (!io) {
    console.error(
      "Socket.IO not initialized. Trading socket engine cannot start."
    );
    return;
  }

  // Set up socket handlers
  io.on("connection", async (socket) => {
    try {
      const round = await ensureRound();

      // Send current round data
      socket.emit("trading:round", round.toObject());

      // Send current price data
      socket.emit("trading:value", {
        roundId: round.roundId,
        value: Number(round.currentValue),
        previousValue: Number(round.currentValue),
        direction: "same",
        endsAt: round.endsAt,
        status: round.status,
        timestamp: Date.now(),
      });

      console.log(`Trading data sent to socket: ${socket.id}`);
    } catch (error) {
      console.error("TRADING SOCKET CONNECTION ERROR:", error);
      socket.emit("trading:error", {
        message: "Failed to initialize trading data",
      });
    }
  });

  // Start the tick interval
  timer = setInterval(() => {
    tick();
  }, 1000);

  // Run initial tick
  setTimeout(() => {
    tick();
  }, 100);

  engineStarted = true;
  console.log("Trading socket engine started successfully");
}

function stopTradingSocket() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  engineStarted = false;
  console.log("Trading socket engine stopped");
}

module.exports = {
  initTradingSocket,
  stopTradingSocket,
};