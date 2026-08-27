const mongoose = require("mongoose");

// ==========================================================
// GAME TYPES
// ==========================================================

// 2-digit market
const TWO_DIGIT_GAME_TYPES = [
  "single",
  "jodi",
  "last-digit",
  "first-digit",
];

// 3-digit market
const THREE_DIGIT_GAME_TYPES = [
  "single",
  "single-Patti",
  "double-Patti",
  "triple-Patti",
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
// STATIC: FORMAT WINNING NUMBER (UPDATED - Supports both 6-digit and 2/3-digit)
// ==========================================================

resultSchema.statics.formatWinningNumber = function (value, gameType) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  let number = String(value).trim();

  // Remove any non-digit characters (keep only digits)
  number = number.replace(/[^0-9]/g, '');

  if (!number) {
    throw new Error("Invalid winning number: must contain digits");
  }

  switch (gameType) {
    // ====================================================
    // JODI - First 2 digits
    // ====================================================
    case "jodi":
      if (number.length === 6) {
        return number.substring(0, 2); // "123456" → "12"
      }
      if (number.length >= 1 && number.length <= 2) {
        return number.padStart(2, "0");
      }
      throw new Error("Jodi winning number must be 2 digits (00-99) or 6-digit number");

    // ====================================================
    // PANNA - First 3 digits
    // ====================================================
    case "panna":
      if (number.length === 6) {
        return number.substring(0, 3); // "123456" → "123"
      }
      if (number.length >= 1 && number.length <= 3) {
        return number.padStart(3, "0");
      }
      throw new Error("Panna winning number must be 3 digits (000-999) or 6-digit number");

    // ====================================================
    // HALF SANGAM - Panna + Digit
    // ====================================================
    case "half-sangam": {
      // If 6-digit: first 3 + last 1
      if (number.length === 6) {
        const panna = number.substring(0, 3);
        const digit = number.substring(5, 6);
        return `${panna}-${digit}`; // "123456" → "123-6"
      }

      // If 4-digit: first 3 + last 1
      if (number.length === 4) {
        const panna = number.substring(0, 3);
        const digit = number.substring(3, 4);
        return `${panna}-${digit}`; // "1234" → "123-4"
      }

      // If already in proper format
      if (/^\d{3}-\d$/.test(number) || /^\d-\d{3}$/.test(number)) {
        return number;
      }

      // Try to parse if number is 3 digits (treat as panna)
      if (number.length === 3) {
        return `${number}-0`;
      }

      // Try to parse if number is 1 digit (treat as digit)
      if (number.length === 1) {
        return `000-${number}`;
      }

      throw new Error("Half Sangam winning number must be Panna-Digit (123-6) or 6-digit number");
    }

    // ====================================================
    // FULL SANGAM - Panna + Panna
    // ====================================================
    case "full-sangam": {
      // If 6-digit: split into two pannas
      if (number.length === 6) {
        const firstPanna = number.substring(0, 3);
        const secondPanna = number.substring(3, 6);
        return `${firstPanna}-${secondPanna}`; // "123456" → "123-456"
      }

      // If already in proper format
      if (/^\d{3}-\d{3}$/.test(number)) {
        return number;
      }

      throw new Error("Full Sangam winning number must be Panna-Panna (123-456) or 6-digit number");
    }

    // ====================================================
    // LAST DIGIT - Last digit
    // ====================================================
    case "last-digit":
      if (number.length === 6) {
        return number.substring(5, 6); // "123456" → "6"
      }
      if (number.length >= 1 && number.length <= 2) {
        return number.padStart(2, "0");
      }
      throw new Error("Last digit winning number must be 1-2 digits (0-99) or 6-digit number");

    // ====================================================
    // FIRST DIGIT - First digit
    // ====================================================
    case "first-digit":
      if (number.length === 6) {
        return number.substring(0, 1); // "012345" → "0"
      }
      if (number.length === 1) {
        return number; // "0" → "0"
      }
      if (number.length === 2) {
        return number.substring(0, 1); // "01" → "0"
      }
      throw new Error("First digit winning number must be single digit (0-9) or 6-digit number");

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
// METHOD: CHECK BID WIN (UPDATED - Supports both formats)
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
    case "jodi": {
      // Remove non-digits from bid
      const bidDigits = bidNumStr.replace(/[^0-9]/g, '');
      if (!bidDigits) return false;

      // Pad bid to 2 digits and take first 2
      const formattedBid = bidDigits.padStart(2, "0").substring(0, 2);
      return winningNumStr === formattedBid;
    }

    // ====================================================
    // PANNA - First 3 digits
    // ====================================================
    case "panna": {
      // Remove non-digits from bid
      const bidDigits = bidNumStr.replace(/[^0-9]/g, '');
      if (!bidDigits) return false;

      // Pad bid to 3 digits
      const formattedBid = bidDigits.padStart(3, "0");
      return winningNumStr === formattedBid;
    }

    // ====================================================
    // HALF SANGAM - Supports multiple formats
    // ====================================================
    case "half-sangam": {
      // Remove non-digits from bid
      const bidDigits = bidNumStr.replace(/[^0-9]/g, '');
      if (!bidDigits) return false;

      // Check if bid is single digit (0-9)
      if (bidDigits.length === 1) {
        return winningNumStr.slice(-1) === bidDigits;
      }

      // Check if bid is 3 digits (000-999)
      if (bidDigits.length === 3) {
        const winningPanna = winningNumStr.substring(0, 3);
        return winningPanna === bidDigits;
      }

      // Check if bid is 4 digits (panna + digit)
      if (bidDigits.length === 4) {
        const bidPanna = bidDigits.substring(0, 3);
        const bidDigit = bidDigits.substring(3, 4);
        const winningPanna = winningNumStr.substring(0, 3);
        const winningDigit = winningNumStr.slice(-1);
        return bidPanna === winningPanna && bidDigit === winningDigit;
      }

      // Check if bid is 6 digits
      if (bidDigits.length === 6) {
        const bidPanna = bidDigits.substring(0, 3);
        const bidDigit = bidDigits.substring(5, 6);
        const winningPanna = winningNumStr.substring(0, 3);
        const winningDigit = winningNumStr.slice(-1);
        return bidPanna === winningPanna && bidDigit === winningDigit;
      }

      // Full format match
      return winningNumStr === bidNumStr;
    }

    // ====================================================
    // FULL SANGAM - Exact match
    // ====================================================
    case "full-sangam": {
      // Remove non-digits from bid
      const bidDigits = bidNumStr.replace(/[^0-9]/g, '');
      if (!bidDigits) return false;

      // If bid is 6 digits, format as panna-panna
      if (bidDigits.length === 6) {
        const firstPanna = bidDigits.substring(0, 3);
        const secondPanna = bidDigits.substring(3, 6);
        const formattedBid = `${firstPanna}-${secondPanna}`;
        return winningNumStr === formattedBid;
      }

      return winningNumStr === bidNumStr;
    }

    // ====================================================
    // LAST DIGIT - Last digit
    // ====================================================
    case "last-digit": {
      // Remove non-digits from bid
      const bidDigits = bidNumStr.replace(/[^0-9]/g, '');
      if (!bidDigits) return false;

      const bidLastDigit = bidDigits.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;
    }

    // ====================================================
    // FIRST DIGIT - First digit
    // ====================================================
    case "first-digit": {
      // Remove non-digits from bid
      const bidDigits = bidNumStr.replace(/[^0-9]/g, '');
      if (!bidDigits) return false;

      const bidFirstDigit = bidDigits.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;
    }

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