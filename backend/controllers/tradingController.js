const TradingRound = require("../models/TradingRound");
const TradingTrade = require("../models/TradingTrade");

const DEFAULT_PRICE = 107960;
const ROUND_DURATION_MS = 60 * 1000;

function makeRoundId() {
  return `TR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getUserId(req) {
  return (
    req.user?._id?.toString() ||
    req.user?.id?.toString() ||
    req.headers["x-demo-user-id"] ||
    null
  );
}

async function createRound(req, res) {
  try {
    const existing = await TradingRound.findOne({
      status: "active",
      endsAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Active round already exists",
        round: existing,
      });
    }

    const now = new Date();
    const startValue = Number(req.body?.startValue || DEFAULT_PRICE);

    const round = await TradingRound.create({
      roundId: makeRoundId(),
      startValue,
      currentValue: startValue,
      status: "active",
      startsAt: now,
      endsAt: new Date(now.getTime() + ROUND_DURATION_MS),
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("trading:round", round.toObject());
    }

    return res.status(201).json({
      success: true,
      message: "Trading round created",
      round,
    });
  } catch (error) {
    console.error("CREATE ROUND ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create trading round",
      error: error.message,
    });
  }
}

async function getCurrentRound(req, res) {
  try {
    let round = await TradingRound.findOne({
      status: "active",
      endsAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!round) {
      const now = new Date();
      round = await TradingRound.create({
        roundId: makeRoundId(),
        startValue: 0,
        currentValue: DEFAULT_PRICE,
        status: "active",
        startsAt: now,
        endsAt: new Date(now.getTime() + ROUND_DURATION_MS),
      });

      const io = req.app.get("io");
      if (io) io.emit("trading:round", round.toObject());
    }

    return res.json({
      success: true,
      round,
    });
  } catch (error) {
    console.error("CURRENT ROUND ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get current trading round",
      error: error.message,
    });
  }
}

async function completeRound(req, res) {
  try {
    const { roundId } = req.body;

    if (!roundId) {
      return res.status(400).json({
        success: false,
        message: "roundId is required",
      });
    }

    const round = await TradingRound.findOne({
      roundId,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Trading round not found",
      });
    }

    if (round.status === "completed") {
      return res.json({
        success: true,
        message: "Round already completed",
        round,
      });
    }

    round.finalValue = Number(round.currentValue);
    round.status = "completed";
    await round.save();

    await resolveTrades(round);

    const io = req.app.get("io");
    if (io) {
      io.emit("trading:completed", {
        roundId: round.roundId,
        finalValue: round.finalValue,
      });
    }

    return res.json({
      success: true,
      message: "Trading round completed",
      round,
    });
  } catch (error) {
    console.error("COMPLETE ROUND ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete trading round",
      error: error.message,
    });
  }
}

async function placeTrade(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required. No user found.",
      });
    }

    const { roundId, amount, direction } = req.body;
    const numericAmount = Number(amount);

    if (!roundId) {
      return res.status(400).json({
        success: false,
        message: "roundId is required",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "Direction must be up or down",
      });
    }

    const round = await TradingRound.findOne({
      roundId,
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Trading round not found",
      });
    }

    if (round.status !== "active" || new Date(round.endsAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Trading round is not active",
      });
    }

    const existingTrade = await TradingTrade.findOne({
      userId,
      roundId,
      status: "active",
    });

    if (existingTrade) {
      return res.status(400).json({
        success: false,
        message: "You already have a trade in this round",
      });
    }

    const entryValue = Number(round.currentValue);

    if (!Number.isFinite(entryValue)) {
      return res.status(400).json({
        success: false,
        message: "Invalid market value",
      });
    }

    const trade = await TradingTrade.create({
      userId,
      roundId,
      amount: numericAmount,
      direction,
      entryValue,
      result: "pending",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Demo trade placed successfully",
      trade,
    });
  } catch (error) {
    console.error("PLACE TRADE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place trade",
      error: error.message,
    });
  }
}

async function getMyActiveTrade(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }

    const trade = await TradingTrade.findOne({
      userId,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      trade: trade || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get active trade",
      error: error.message,
    });
  }
}

async function resolveTrades(round) {
  const trades = await TradingTrade.find({
    roundId: round.roundId,
    status: "active",
  });

  for (const trade of trades) {
    let result = "cancelled";

    if (round.finalValue > trade.entryValue) {
      result = trade.direction === "up" ? "won" : "lost";
    } else if (round.finalValue < trade.entryValue) {
      result = trade.direction === "down" ? "won" : "lost";
    }

    trade.exitValue = round.finalValue;
    trade.result = result;
    trade.status = result === "cancelled" ? "cancelled" : "completed";

    await trade.save();
  }

  return trades;
}

module.exports = {
  createRound,
  getCurrentRound,
  completeRound,
  placeTrade,
  getMyActiveTrade,
  resolveTrades,
};
