const mongoose = require("mongoose");

// ==========================================================
// GAME TYPES
// ==========================================================

// 2-digit market
const TWO_DIGIT_GAME_TYPES = [
  "jodi",
  "last-digit",
  "first-digit",
];

// 3-digit market
const THREE_DIGIT_GAME_TYPES = [
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

const GAME_TYPES = [
  ...new Set([
    ...TWO_DIGIT_GAME_TYPES,
    ...THREE_DIGIT_GAME_TYPES,
  ]),
];

// ==========================================================
// WINNING NUMBERS SCHEMA
// ==========================================================

const winningNumbersSchema = new mongoose.Schema(
  {
    jodi: {
      type: String,
      default: null,
      trim: true,
    },
    panna: {
      type: String,
      default: null,
      trim: true,
    },
    "half-sangam": {
      type: String,
      default: null,
      trim: true,
    },
    "full-sangam": {
      type: String,
      default: null,
      trim: true,
    },
    "last-digit": {
      type: String,
      default: null,
      trim: true,
    },
    "first-digit": {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================================
// RESULT SCHEMA
// ==========================================================

const resultSchema = new mongoose.Schema(
  {
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: true,
      index: true,
    },
    marketName: {
      type: String,
      required: true,
      trim: true,
    },
    digitType: {
      type: String,
      enum: ["2-digit", "3-digit"],
      required: true,
      index: true,
    },
    winningNumber: {
      type: winningNumbersSchema,
      default: () => ({}),
    },
    resultDate: {
      type: Date,
      required: true,
      index: true,
    },
    nextOpenDate: {
      type: Date,
      required: true,
      index: true,
    },
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    totalBids: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWinningBids: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayout: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "declared", "cancelled"],
      default: "declared",
      index: true,
    },
    remarks: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================================
// INDEXES
// ==========================================================

resultSchema.index(
  {
    marketId: 1,
    resultDate: 1,
  },
  {
    unique: true,
  }
);

resultSchema.index({ resultDate: -1 });
resultSchema.index({ nextOpenDate: -1 });
resultSchema.index({ marketId: 1, status: 1 });
resultSchema.index({ digitType: 1, resultDate: -1 });

// ==========================================================
// STATIC: GET ALLOWED GAME TYPES
// ==========================================================

resultSchema.statics.getGameTypesForDigitType = function (digitType) {
  if (digitType === "2-digit") {
    return [...TWO_DIGIT_GAME_TYPES];
  }
  if (digitType === "3-digit") {
    return [...THREE_DIGIT_GAME_TYPES];
  }
  return [];
};

// ==========================================================
// STATIC: CHECK GAME TYPE
// ==========================================================

resultSchema.statics.isGameTypeAllowed = function (digitType, gameType) {
  const gameTypes = this.getGameTypesForDigitType(digitType);
  return gameTypes.includes(gameType);
};

// ==========================================================
// STATIC: FORMAT WINNING NUMBER (FIXED)
// ==========================================================

resultSchema.statics.formatWinningNumber = function (value, gameType) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  let number = String(value).trim();

  switch (gameType) {
    // ====================================================
    // JODI - First 2 digits from 6-digit number
    // ====================================================
    case "jodi":
      if (/^[0-9]{6}$/.test(number)) {
        return number.substring(0, 2); // "123456" → "12"
      }
      if (/^[0-9]{1,2}$/.test(number)) {
        return number.padStart(2, "0");
      }
      throw new Error("Jodi winning number must be either 2 digits (00-99) or a 6-digit number");

    // ====================================================
    // PANNA - First 3 digits from 6-digit number
    // ====================================================
    case "panna":
      if (/^[0-9]{6}$/.test(number)) {
        return number.substring(0, 3); // "123456" → "123"
      }
      if (!/^[0-9]{1,3}$/.test(number)) {
        throw new Error("Panna winning number must be 000-999");
      }
      return number.padStart(3, "0");

    // ====================================================
    // HALF SANGAM - First 3 digits + Last 1 digit from 6-digit number
    // ====================================================
    case "half-sangam": {
      // If 6-digit number, split into panna + digit
      // Example: "123456" → "123-6" (first 3 digits + last 1 digit)
      if (/^[0-9]{6}$/.test(number)) {
        const panna = number.substring(0, 3); // "123"
        const digit = number.substring(5, 6); // "6"
        return `${panna}-${digit}`; // "123-6"
      }

      // Already in proper format
      if (!/^[0-9]{3}-[0-9]$/.test(number) && !/^[0-9]-[0-9]{3}$/.test(number)) {
        throw new Error("Half Sangam winning number must be Panna + Digit (123-6) or Digit + Panna (6-123)");
      }
      return number;
    }

    // ====================================================
    // FULL SANGAM - First 3 digits + Last 3 digits from 6-digit number
    // ====================================================
    case "full-sangam": {
      // If 6-digit number, split into two pannas
      // Example: "123456" → "123-456"
      if (/^[0-9]{6}$/.test(number)) {
        const firstPanna = number.substring(0, 3); // "123"
        const secondPanna = number.substring(3, 6); // "456"
        return `${firstPanna}-${secondPanna}`; // "123-456"
      }

      if (!/^[0-9]{3}-[0-9]{3}$/.test(number)) {
        throw new Error("Full Sangam winning number must be Panna + Panna (123-456)");
      }
      return number;
    }

    // ====================================================
    // LAST DIGIT - Last 1 digit from 6-digit number
    // ====================================================
    case "last-digit":
      if (/^[0-9]{6}$/.test(number)) {
        return number.substring(5, 6); // "123456" → "6"
      }
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error("Last digit winning number must be 00-99");
      }
      return number.padStart(2, "0");

    // ====================================================
    // FIRST DIGIT - First 1 digit from 6-digit number
    // ====================================================
    case "first-digit":
      if (/^[0-9]{6}$/.test(number)) {
        return number.substring(0, 1); // "123456" → "1"
      }
      if (!/^[0-9]{1}$/.test(number)) {
        throw new Error("First digit winning number must be a single digit (0-9)");
      }
      return number;

    default:
      throw new Error(`Invalid game type: ${gameType}`);
  }
};

// ==========================================================
// STATIC: FORMAT ALL WINNING NUMBERS
// ==========================================================

resultSchema.statics.formatWinningNumbers = function (winningNumbers, digitType) {
  if (!winningNumbers || typeof winningNumbers !== "object") {
    throw new Error("Winning numbers object is required");
  }

  const allowedGames = this.getGameTypesForDigitType(digitType);

  if (!["2-digit", "3-digit"].includes(digitType)) {
    throw new Error("digitType must be 2-digit or 3-digit");
  }

  const formatted = {};

  for (const gameType of allowedGames) {
    const value = winningNumbers[gameType];

    if (value === undefined || value === null || value === "") {
      formatted[gameType] = null;
      continue;
    }

    formatted[gameType] = this.formatWinningNumber(value, gameType);
  }

  return formatted;
};

// ==========================================================
// STATIC: LATEST RESULT
// ==========================================================

resultSchema.statics.getLatestResult = async function (marketId) {
  return this.findOne({
    marketId,
    status: "declared",
  })
    .sort({
      resultDate: -1,
      createdAt: -1,
    })
    .exec();
};

// ==========================================================
// STATIC: DATE RANGE
// ==========================================================

resultSchema.statics.getResultsByDateRange = async function (startDate, endDate, marketId = null) {
  const query = {
    resultDate: {
      $gte: startDate,
      $lte: endDate,
    },
    status: "declared",
  };

  if (marketId) {
    query.marketId = marketId;
  }

  return this.find(query)
    .sort({
      resultDate: -1,
    })
    .exec();
};

// ==========================================================
// STATIC: STATS
// ==========================================================

resultSchema.statics.getStats = async function (marketId) {
  const match = {
    marketId: new mongoose.Types.ObjectId(marketId),
    status: "declared",
  };

  const stats = await this.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        totalPayout: { $sum: "$totalPayout" },
        totalWinners: { $sum: "$totalWinningBids" },
        totalBids: { $sum: "$totalBids" },
        avgPayout: { $avg: "$totalPayout" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalResults: 0,
      totalPayout: 0,
      totalWinners: 0,
      totalBids: 0,
      avgPayout: 0,
    }
  );
};

// ==========================================================
// VIRTUAL: SUMMARY
// ==========================================================

resultSchema.virtual("summary").get(function () {
  return {
    marketId: this.marketId,
    marketName: this.marketName,
    digitType: this.digitType,
    winningNumber: this.winningNumber,
    resultDate: this.resultDate,
    nextOpenDate: this.nextOpenDate,
    totalBids: this.totalBids,
    totalWinningBids: this.totalWinningBids,
    totalPayout: this.totalPayout,
    status: this.status,
  };
});

// ==========================================================
// METHOD: GET WINNING NUMBER
// ==========================================================

resultSchema.methods.getWinningNumber = function (gameType) {
  return this.winningNumber?.[gameType] ?? null;
};

// ==========================================================
// METHOD: CHECK BID WIN (FIXED)
// ==========================================================

resultSchema.methods.checkBidWin = function (bidNumber, bidGameType) {
  const winningNumber = this.winningNumber?.[bidGameType];

  if (winningNumber === undefined || winningNumber === null || winningNumber === "") {
    return false;
  }

  const winningNumStr = String(winningNumber).trim();
  const bidNumStr = String(bidNumber).trim();

  switch (bidGameType) {
    // ====================================================
    // JODI - First 2 digits
    // ====================================================
    case "jodi":
      return winningNumStr === bidNumStr.padStart(2, "0").substring(0, 2);

    // ====================================================
    // PANNA - First 3 digits
    // ====================================================
    case "panna":
      return winningNumStr === bidNumStr.padStart(3, "0");

    // ====================================================
    // HALF SANGAM - Supports both formats
    // ====================================================
    case "half-sangam": {
      // Check if bid is single digit (0-9)
      if (/^[0-9]$/.test(bidNumStr)) {
        return winningNumStr.slice(-1) === bidNumStr;
      }
      // Check if bid is 3 digits (000-999)
      if (/^[0-9]{3}$/.test(bidNumStr)) {
        return winningNumStr.substring(0, 3) === bidNumStr;
      }
      // Full format match
      return winningNumStr === bidNumStr;
    }

    // ====================================================
    // FULL SANGAM - Exact match
    // ====================================================
    case "full-sangam":
      return winningNumStr === bidNumStr;

    // ====================================================
    // LAST DIGIT - Last 1 digit
    // ====================================================
    case "last-digit":
      return winningNumStr.slice(-1) === bidNumStr.slice(-1);

    // ====================================================
    // FIRST DIGIT - First 1 digit
    // ====================================================
    case "first-digit":
      return winningNumStr.charAt(0) === bidNumStr.charAt(0);

    default:
      return false;
  }
};

// ==========================================================
// JSON
// ==========================================================

resultSchema.set("toJSON", {
  virtuals: true,
});

resultSchema.set("toObject", {
  virtuals: true,
});

// ==========================================================
// MODEL
// ==========================================================

module.exports = mongoose.models.results || mongoose.model("results", resultSchema);