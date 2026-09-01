const TradingRound = require("../models/TradingRound");
const {
  resolveTrades,
} = require("../controllers/tradingController");

const DEFAULT_PRICE = 107960;
const ROUND_DURATION_MS = 60 * 1000;

let engineStarted = false;
let timer = null;
let currentPrice = DEFAULT_PRICE;

function makeRoundId() {
  return `TR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function ensureRound() {
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
  }

  currentPrice = Number(round.currentValue);
  return round;
}

function randomNextPrice(value) {
  const maxMove = value * 0.0012;
  const movement =
    (Math.random() * 2 - 1) * maxMove;

  return Math.max(1, value + movement);
}

async function tick(io) {
  try {
    let round = await ensureRound();

    if (
      round.status !== "active" ||
      new Date(round.endsAt) <= new Date()
    ) {
      round.finalValue = Number(round.currentValue);
      round.status = "completed";
      await round.save();

      await resolveTrades(round);

      io.emit("trading:completed", {
        roundId: round.roundId,
        finalValue: round.finalValue,
      });

      const now = new Date();

      round = await TradingRound.create({
        roundId: makeRoundId(),
        startValue: Number(round.finalValue),
        currentValue: Number(round.finalValue),
        status: "active",
        startsAt: now,
        endsAt: new Date(
          now.getTime() + ROUND_DURATION_MS
        ),
      });

      currentPrice = Number(round.currentValue);

      io.emit("trading:round", round.toObject());
      return;
    }

    const previousValue = currentPrice;
    currentPrice = randomNextPrice(currentPrice);

    round.currentValue = currentPrice;
    await round.save();

    const delta = currentPrice - previousValue;

    const direction =
      delta > 0
        ? "up"
        : delta < 0
        ? "down"
        : "same";

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

function initTradingSocket(io) {
  if (engineStarted) return;
  engineStarted = true;

  io.on("connection", async (socket) => {
    try {
      const round = await ensureRound();

      socket.emit("trading:round", round.toObject());

      socket.emit("trading:value", {
        roundId: round.roundId,
        value: Number(round.currentValue),
        previousValue: Number(round.currentValue),
        direction: "same",
        endsAt: round.endsAt,
        status: round.status,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(
        "TRADING SOCKET CONNECTION ERROR:",
        error
      );
    }
  });

  timer = setInterval(() => {
    tick(io);
  }, 1000);

  tick(io);

  console.log("Trading socket engine started");
}

function stopTradingSocket() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  engineStarted = false;
}

module.exports = {
  initTradingSocket,
  stopTradingSocket,
};
