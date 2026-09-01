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
    // ========================================================
    // SINGLE
    // Example:
    // 123456 -> 1
    // ========================================================
    single: {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // SINGLE PATTI
    // Example:
    // 123456 -> 123
    // ========================================================
    "single-Patti": {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // DOUBLE PATTI
    // ========================================================
    "double-Patti": {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // TRIPLE PATTI
    // ========================================================
    "triple-Patti": {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // JODI
    // ========================================================
    jodi: {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // PANNA
    // ========================================================
    panna: {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // HALF SANGAM
    // ========================================================
    "half-sangam": {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // FULL SANGAM
    // ========================================================
    "full-sangam": {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // LAST DIGIT
    // ========================================================
    "last-digit": {
      type: String,
      default: null,
      trim: true,
    },

    // ========================================================
    // FIRST DIGIT
    // ========================================================
    "first-digit": {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

// ==========================================================
// RESULT SCHEMA
// ==========================================================

const resultSchema = new mongoose.Schema(
  {
    // ========================================================
    // MARKET
    // ========================================================

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

    // ========================================================
    // DIGIT TYPE
    // ========================================================

    digitType: {
      type: String,
      enum: ["2-digit", "3-digit"],
      required: true,
      index: true,
    },

    // ========================================================
    // WINNING NUMBERS
    // ========================================================

    winningNumber: {
      type: winningNumbersSchema,
      default: () => ({}),
    },

    // ========================================================
    // DATES
    // ========================================================

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

    // ========================================================
    // DECLARED BY
    // ========================================================

    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // ========================================================
    // STATS
    // ========================================================

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

    // ========================================================
    // STATUS
    // ========================================================

    status: {
      type: String,
      enum: ["pending", "declared", "cancelled"],
      default: "declared",
      index: true,
    },

    // ========================================================
    // REMARKS
    // ========================================================

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

resultSchema.index({
  resultDate: -1,
});

resultSchema.index({
  nextOpenDate: -1,
});

resultSchema.index({
  marketId: 1,
  status: 1,
});

resultSchema.index({
  digitType: 1,
  resultDate: -1,
});

// ==========================================================
// STATIC: GET ALLOWED GAME TYPES
// ==========================================================

resultSchema.statics.getGameTypesForDigitType = function (
  digitType
) {
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

resultSchema.statics.isGameTypeAllowed = function (
  digitType,
  gameType
) {
  const gameTypes =
    this.getGameTypesForDigitType(digitType);

  return gameTypes.includes(gameType);
};

// ==========================================================
// HELPER: CLEAN DIGITS
// ==========================================================

const cleanDigits = (value) => {
  return String(value ?? "").replace(/[^0-9]/g, "");
};

// ==========================================================
// HELPER: SINGLE DIGIT
//
// IMPORTANT:
// 123456 -> 1
//
// This means SINGLE uses FIRST digit,
// not digit-sum.
// ==========================================================

const getSingleDigit = (value) => {
  const digits = cleanDigits(value);

  if (!digits) {
    return "";
  }

  return digits.charAt(0);
};

// ==========================================================
// HELPER: FIRST DIGIT
// ==========================================================

const getFirstDigit = (value) => {
  const digits = cleanDigits(value);

  if (!digits) {
    return "";
  }

  return digits.charAt(0);
};

// ==========================================================
// HELPER: LAST DIGIT
// ==========================================================

const getLastDigit = (value) => {
  const digits = cleanDigits(value);

  if (!digits) {
    return "";
  }

  return digits.charAt(digits.length - 1);
};

// ==========================================================
// HELPER: THREE DIGIT
// ==========================================================

const getThreeDigit = (value) => {
  const digits = cleanDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length >= 3) {
    return digits.substring(0, 3);
  }

  return digits.padStart(3, "0");
};

// ==========================================================
// HELPER: SINGLE PATTI
//
// All 3 digits must be different.
//
// 123 = true
// 456 = true
// 112 = false
// 111 = false
// ==========================================================

const isSinglePatti = (value) => {
  const digits = getThreeDigit(value);

  if (digits.length !== 3) {
    return false;
  }

  return new Set(digits.split("")).size === 3;
};

// ==========================================================
// HELPER: DOUBLE PATTI
//
// Exactly one pair.
//
// 112 = true
// 121 = true
// 211 = true
// 505 = true
// 123 = false
// 111 = false
// ==========================================================

const isDoublePatti = (value) => {
  const digits = getThreeDigit(value);

  if (digits.length !== 3) {
    return false;
  }

  const counts = {};

  for (const digit of digits) {
    counts[digit] =
      (counts[digit] || 0) + 1;
  }

  return (
    Object.values(counts)
      .sort()
      .join(",") === "1,2"
  );
};

// ==========================================================
// HELPER: TRIPLE PATTI
//
// 111 = true
// 222 = true
// 123 = false
// ==========================================================

const isTriplePatti = (value) => {
  const digits = getThreeDigit(value);

  if (digits.length !== 3) {
    return false;
  }

  return (
    digits.charAt(0) === digits.charAt(1) &&
    digits.charAt(1) === digits.charAt(2)
  );
};

// ==========================================================
// STATIC: FORMAT WINNING NUMBER
// ==========================================================

resultSchema.statics.formatWinningNumber =
  function (value, gameType) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    let number = String(value).trim();

    number = cleanDigits(number);

    if (!number) {
      throw new Error(
        "Invalid winning number: must contain digits"
      );
    }

    switch (gameType) {
      // ======================================================
      // SINGLE
      //
      // 123456 -> 1
      // ======================================================

      case "single":
        if (number.length >= 1) {
          return number.charAt(0);
        }

        throw new Error(
          "Single winning number must contain digits"
        );

      // ======================================================
      // SINGLE PATTI
      //
      // 123456 -> 123
      // ======================================================

      case "single-Patti":
        if (number.length === 6) {
          const openPatti =
            number.substring(0, 3);

          if (!isSinglePatti(openPatti)) {
            throw new Error(
              `Open Patti ${openPatti} is not a Single Patti`
            );
          }

          return openPatti;
        }

        if (number.length === 3) {
          if (!isSinglePatti(number)) {
            throw new Error(
              `${number} is not a Single Patti`
            );
          }

          return number;
        }

        throw new Error(
          "Single Patti winning number must be 3 digits or 6-digit number"
        );

      // ======================================================
      // DOUBLE PATTI
      //
      // 123456 -> open 123
      // ======================================================

      case "double-Patti":
        if (number.length === 6) {
          const openPatti =
            number.substring(0, 3);

          if (!isDoublePatti(openPatti)) {
            throw new Error(
              `Open Patti ${openPatti} is not a Double Patti`
            );
          }

          return openPatti;
        }

        if (number.length === 3) {
          if (!isDoublePatti(number)) {
            throw new Error(
              `${number} is not a Double Patti`
            );
          }

          return number;
        }

        throw new Error(
          "Double Patti winning number must be 3 digits or 6-digit number"
        );

      // ======================================================
      // TRIPLE PATTI
      // ======================================================

      case "triple-Patti":
        if (number.length === 6) {
          const openPatti =
            number.substring(0, 3);

          if (!isTriplePatti(openPatti)) {
            throw new Error(
              `Open Patti ${openPatti} is not a Triple Patti`
            );
          }

          return openPatti;
        }

        if (number.length === 3) {
          if (!isTriplePatti(number)) {
            throw new Error(
              `${number} is not a Triple Patti`
            );
          }

          return number;
        }

        throw new Error(
          "Triple Patti winning number must be 3 digits or 6-digit number"
        );

      // ======================================================
      // JODI
      //
      // 123456 -> 12
      // ======================================================

      case "jodi":
        if (number.length === 6) {
          return number.substring(0, 2);
        }

        if (
          number.length >= 1 &&
          number.length <= 2
        ) {
          return number.padStart(2, "0");
        }

        throw new Error(
          "Jodi winning number must be 2 digits or 6-digit number"
        );

      // ======================================================
      // PANNA
      //
      // 123456 -> 123
      // ======================================================

      case "panna":
        if (number.length === 6) {
          return number.substring(0, 3);
        }

        if (
          number.length >= 1 &&
          number.length <= 3
        ) {
          return number.padStart(3, "0");
        }

        throw new Error(
          "Panna winning number must be 3 digits or 6-digit number"
        );

      // ======================================================
      // HALF SANGAM
      //
      // 123456 -> 123-6
      // ======================================================

      case "half-sangam": {
        if (number.length === 6) {
          const panna =
            number.substring(0, 3);

          const digit =
            number.substring(5, 6);

          return `${panna}-${digit}`;
        }

        if (number.length === 4) {
          const panna =
            number.substring(0, 3);

          const digit =
            number.substring(3, 4);

          return `${panna}-${digit}`;
        }

        if (
          /^\d{3}-\d$/.test(
            String(value).trim()
          ) ||
          /^\d-\d{3}$/.test(
            String(value).trim()
          )
        ) {
          return String(value).trim();
        }

        if (number.length === 3) {
          return `${number}-0`;
        }

        if (number.length === 1) {
          return `000-${number}`;
        }

        throw new Error(
          "Half Sangam must be Panna-Digit"
        );
      }

      // ======================================================
      // FULL SANGAM
      //
      // 123456 -> 123-456
      // ======================================================

      case "full-sangam": {
        if (number.length === 6) {
          const firstPanna =
            number.substring(0, 3);

          const secondPanna =
            number.substring(3, 6);

          return `${firstPanna}-${secondPanna}`;
        }

        const original =
          String(value).trim();

        if (
          /^\d{3}-\d{3}$/.test(
            original
          )
        ) {
          return original;
        }

        throw new Error(
          "Full Sangam must be Panna-Panna"
        );
      }

      // ======================================================
      // LAST DIGIT
      //
      // 123456 -> 6
      // ======================================================

      case "last-digit":
        if (number.length === 6) {
          return number.substring(5, 6);
        }

        if (
          number.length >= 1 &&
          number.length <= 2
        ) {
          return number.padStart(2, "0");
        }

        throw new Error(
          "Last digit winning number must be 1-2 digits or 6-digit number"
        );

      // ======================================================
      // FIRST DIGIT
      //
      // 123456 -> 1
      // ======================================================

      case "first-digit":
        if (number.length === 6) {
          return number.substring(0, 1);
        }

        if (number.length === 1) {
          return number;
        }

        if (number.length === 2) {
          return number.substring(0, 1);
        }

        throw new Error(
          "First digit winning number must be single digit or 6-digit number"
        );

      default:
        throw new Error(
          `Invalid game type: ${gameType}`
        );
    }
  };

// ==========================================================
// STATIC: FORMAT ALL WINNING NUMBERS
// ==========================================================

resultSchema.statics.formatWinningNumbers =
  function (winningNumbers, digitType) {
    if (
      !winningNumbers ||
      typeof winningNumbers !== "object" ||
      Array.isArray(winningNumbers)
    ) {
      throw new Error(
        "Winning numbers object is required"
      );
    }

    const allowedGames =
      this.getGameTypesForDigitType(
        digitType
      );

    if (
      !["2-digit", "3-digit"].includes(
        digitType
      )
    ) {
      throw new Error(
        "digitType must be 2-digit or 3-digit"
      );
    }

    const formatted = {};

    for (const gameType of allowedGames) {
      const value =
        winningNumbers[gameType];

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        formatted[gameType] = null;
        continue;
      }

      formatted[gameType] =
        this.formatWinningNumber(
          value,
          gameType
        );
    }

    return formatted;
  };

// ==========================================================
// STATIC: LATEST RESULT
// ==========================================================

resultSchema.statics.getLatestResult =
  async function (marketId) {
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

resultSchema.statics.getResultsByDateRange =
  async function (
    startDate,
    endDate,
    marketId = null
  ) {
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

resultSchema.statics.getStats =
  async function (marketId) {
    const match = {
      marketId:
        new mongoose.Types.ObjectId(
          marketId
        ),
      status: "declared",
    };

    const stats =
      await this.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: null,

            totalResults: {
              $sum: 1,
            },

            totalPayout: {
              $sum: "$totalPayout",
            },

            totalWinners: {
              $sum: "$totalWinningBids",
            },

            totalBids: {
              $sum: "$totalBids",
            },

            avgPayout: {
              $avg: "$totalPayout",
            },
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

resultSchema.virtual("summary").get(
  function () {
    return {
      marketId: this.marketId,
      marketName: this.marketName,
      digitType: this.digitType,
      winningNumber: this.winningNumber,
      resultDate: this.resultDate,
      nextOpenDate: this.nextOpenDate,
      totalBids: this.totalBids,
      totalWinningBids:
        this.totalWinningBids,
      totalPayout: this.totalPayout,
      status: this.status,
    };
  }
);

// ==========================================================
// METHOD: GET WINNING NUMBER
// ==========================================================

resultSchema.methods.getWinningNumber =
  function (gameType) {
    return (
      this.winningNumber?.[gameType] ??
      null
    );
  };

// ==========================================================
// METHOD: CHECK BID WIN
// ==========================================================

resultSchema.methods.checkBidWin =
  function (bidNumber, bidGameType) {
    const winningNumber =
      this.winningNumber?.[
        bidGameType
      ];

    if (
      winningNumber === undefined ||
      winningNumber === null ||
      winningNumber === ""
    ) {
      return false;
    }

    const winningNumStr =
      String(winningNumber).trim();

    const bidNumStr =
      String(bidNumber).trim();

    const bidDigits =
      cleanDigits(bidNumStr);

    if (!bidDigits) {
      return false;
    }

    switch (bidGameType) {
      // ======================================================
      // SINGLE
      //
      // Winning 123456 => 1
      //
      // Bid 1 => WIN
      // ======================================================

      case "single": {
        const bidSingle =
          bidDigits.charAt(0);

        const winningSingle =
          winningNumStr.charAt(0);

        return (
          bidSingle ===
          winningSingle
        );
      }

      // ======================================================
      // SINGLE PATTI
      //
      // Winning 123 => 123
      // Bid 123 => WIN
      // ======================================================

      case "single-Patti": {
        if (bidDigits.length !== 3) {
          return false;
        }

        if (!isSinglePatti(bidDigits)) {
          return false;
        }

        return (
          winningNumStr === bidDigits
        );
      }

      // ======================================================
      // DOUBLE PATTI
      // ======================================================

      case "double-Patti": {
        if (bidDigits.length !== 3) {
          return false;
        }

        if (!isDoublePatti(bidDigits)) {
          return false;
        }

        return (
          winningNumStr === bidDigits
        );
      }

      // ======================================================
      // TRIPLE PATTI
      // ======================================================

      case "triple-Patti": {
        if (bidDigits.length !== 3) {
          return false;
        }

        if (!isTriplePatti(bidDigits)) {
          return false;
        }

        return (
          winningNumStr === bidDigits
        );
      }

      // ======================================================
      // JODI
      // ======================================================

      case "jodi": {
        const formattedBid =
          bidDigits
            .padStart(2, "0")
            .substring(0, 2);

        return (
          winningNumStr ===
          formattedBid
        );
      }

      // ======================================================
      // PANNA
      // ======================================================

      case "panna": {
        const formattedBid =
          bidDigits
            .padStart(3, "0")
            .substring(0, 3);

        return (
          winningNumStr ===
          formattedBid
        );
      }

      // ======================================================
      // HALF SANGAM
      // ======================================================

      case "half-sangam": {
        if (bidDigits.length === 1) {
          return (
            winningNumStr.slice(-1) ===
            bidDigits
          );
        }

        if (bidDigits.length === 3) {
          return (
            winningNumStr.substring(
              0,
              3
            ) === bidDigits
          );
        }

        if (bidDigits.length === 4) {
          const bidPanna =
            bidDigits.substring(0, 3);

          const bidDigit =
            bidDigits.substring(3, 4);

          const winningParts =
            winningNumStr.split("-");

          if (
            winningParts.length === 2
          ) {
            return (
              winningParts[0] ===
                bidPanna &&
              winningParts[1] ===
                bidDigit
            );
          }

          return (
            winningNumStr.substring(
              0,
              3
            ) === bidPanna &&
            winningNumStr.slice(-1) ===
              bidDigit
          );
        }

        if (bidDigits.length === 6) {
          const bidPanna =
            bidDigits.substring(0, 3);

          const bidDigit =
            bidDigits.substring(5, 6);

          const winningParts =
            winningNumStr.split("-");

          if (
            winningParts.length === 2
          ) {
            return (
              winningParts[0] ===
                bidPanna &&
              winningParts[1] ===
                bidDigit
            );
          }

          return (
            winningNumStr.substring(
              0,
              3
            ) === bidPanna &&
            winningNumStr.slice(-1) ===
              bidDigit
          );
        }

        return (
          winningNumStr ===
          bidNumStr
        );
      }

      // ======================================================
      // FULL SANGAM
      // ======================================================

      case "full-sangam": {
        if (bidDigits.length === 6) {
          const firstPanna =
            bidDigits.substring(0, 3);

          const secondPanna =
            bidDigits.substring(3, 6);

          const formattedBid =
            `${firstPanna}-${secondPanna}`;

          return (
            winningNumStr ===
            formattedBid
          );
        }

        return (
          winningNumStr ===
          bidNumStr
        );
      }

      // ======================================================
      // LAST DIGIT
      // ======================================================

      case "last-digit": {
        const bidLastDigit =
          bidDigits.slice(-1);

        const winningLastDigit =
          winningNumStr.slice(-1);

        return (
          bidLastDigit ===
          winningLastDigit
        );
      }

      // ======================================================
      // FIRST DIGIT
      // ======================================================

      case "first-digit": {
        const bidFirstDigit =
          bidDigits.charAt(0);

        const winningFirstDigit =
          winningNumStr.charAt(0);

        return (
          bidFirstDigit ===
          winningFirstDigit
        );
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

module.exports =
  mongoose.models.results ||
  mongoose.model(
    "results",
    resultSchema
  );