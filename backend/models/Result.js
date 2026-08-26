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

const winningNumbersSchema =
  new mongoose.Schema(
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
    // ======================================================
    // MARKET
    // ======================================================

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

    // ======================================================
    // MARKET DIGIT TYPE
    // ======================================================

    digitType: {
      type: String,
      enum: ["2-digit", "3-digit"],
      required: true,
      index: true,
    },

    // ======================================================
    // ALL WINNING NUMBERS
    // ======================================================

    winningNumber: {
      type: winningNumbersSchema,
      default: () => ({}),
    },

    // ======================================================
    // RESULT DATE
    // ======================================================

    resultDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ======================================================
    // NEXT OPEN DATE
    // ======================================================

    nextOpenDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ======================================================
    // DECLARED BY
    // ======================================================

    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // ======================================================
    // STATISTICS
    // ======================================================

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

    // ======================================================
    // STATUS
    // ======================================================

    status: {
      type: String,
      enum: [
        "pending",
        "declared",
        "cancelled",
      ],
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
// INDEX
// ONE RESULT PER MARKET + DATE
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

resultSchema.statics.getGameTypesForDigitType =
  function (digitType) {
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

resultSchema.statics.isGameTypeAllowed =
  function (
    digitType,
    gameType
  ) {
    const gameTypes =
      this.getGameTypesForDigitType(
        digitType
      );

    return gameTypes.includes(
      gameType
    );
  };

// ==========================================================
// STATIC: FORMAT WINNING NUMBER
// ==========================================================

resultSchema.statics.formatWinningNumber =
  function (
    value,
    gameType
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    let number =
      String(value).trim();

    switch (gameType) {
      // ====================================================
      // JODI
      // ====================================================

      case "jodi":
        if (
          !/^[0-9]{1,2}$/.test(
            number
          )
        ) {
          throw new Error(
            "Jodi winning number must be 00-99"
          );
        }

        return number.padStart(
          2,
          "0"
        );

      // ====================================================
      // PANNA
      // ====================================================

      case "panna":
        if (
          !/^[0-9]{1,3}$/.test(
            number
          )
        ) {
          throw new Error(
            "Panna winning number must be 000-999"
          );
        }

        return number.padStart(
          3,
          "0"
        );

      // ====================================================
      // HALF SANGAM
      // ====================================================

      case "half-sangam": {
        // Panna + Digit, e.g. 123-6
        if (
          !/^[0-9]{3}-[0-9]$/.test(number) &&
          !/^[0-9]-[0-9]{3}$/.test(number)
        ) {
          throw new Error(
            "Half Sangam winning number must be Panna + Digit (123-6) or Digit + Panna (6-123)"
          );
        }

        return number;
      }

      // ====================================================
      // FULL SANGAM
      // ====================================================

      case "full-sangam":
        // Panna + Panna, e.g. 123-456
        if (!/^[0-9]{3}-[0-9]{3}$/.test(number)) {
          throw new Error(
            "Full Sangam winning number must be Panna + Panna (123-456)"
          );
        }

        return number;

      // ====================================================
      // LAST DIGIT
      // ====================================================

      case "last-digit":
        if (
          !/^[0-9]{1,2}$/.test(
            number
          )
        ) {
          throw new Error(
            "Last digit winning number must be 00-99"
          );
        }

        return number.padStart(
          2,
          "0"
        );

      // ====================================================
      // FIRST DIGIT
      // ====================================================

      case "first-digit":
        if (
          !/^[0-9]{1,2}$/.test(
            number
          )
        ) {
          throw new Error(
            "First digit winning number must be 00-99"
          );
        }

        return number.padStart(
          2,
          "0"
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
  function (
    winningNumbers,
    digitType
  ) {
    if (
      !winningNumbers ||
      typeof winningNumbers !==
        "object"
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

    for (
      const gameType of allowedGames
    ) {
      const value =
        winningNumbers[
          gameType
        ];

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        formatted[gameType] =
          null;

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
  async function (
    marketId
  ) {
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
      query.marketId =
        marketId;
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
  async function (
    marketId
  ) {
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
              $sum:
                "$totalWinningBids",
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

resultSchema.virtual(
  "summary"
).get(function () {
  return {
    marketId:
      this.marketId,

    marketName:
      this.marketName,

    digitType:
      this.digitType,

    winningNumber:
      this.winningNumber,

    resultDate:
      this.resultDate,

    nextOpenDate:
      this.nextOpenDate,

    totalBids:
      this.totalBids,

    totalWinningBids:
      this.totalWinningBids,

    totalPayout:
      this.totalPayout,

    status:
      this.status,
  };
});

// ==========================================================
// METHOD: GET WINNING NUMBER
// ==========================================================

resultSchema.methods.getWinningNumber =
  function (gameType) {
    return (
      this.winningNumber?.[
        gameType
      ] ?? null
    );
  };

// ==========================================================
// METHOD: CHECK BID WIN
// ==========================================================

resultSchema.methods.checkBidWin =
  function (
    bidNumber,
    bidGameType
  ) {
    const winningNumber =
      this.winningNumber?.[
        bidGameType
      ];

    if (
      winningNumber ===
        undefined ||
      winningNumber === null ||
      winningNumber === ""
    ) {
      return false;
    }

    const winningNumStr =
      String(
        winningNumber
      ).trim();

    const bidNumStr =
      String(
        bidNumber
      ).trim();

    switch (
      bidGameType
    ) {
      // ====================================================
      // JODI
      // ====================================================

      case "jodi":
        return (
          winningNumStr ===
          bidNumStr.padStart(
            2,
            "0"
          )
        );

      // ====================================================
      // PANNA
      // ====================================================

      case "panna":
        return (
          winningNumStr ===
          bidNumStr.padStart(
            3,
            "0"
          )
        );

      // ====================================================
      // HALF SANGAM
      // ====================================================

      case "half-sangam":
        // 1 digit bid
        if (
          bidNumStr.length === 1
        ) {
          return (
            winningNumStr.slice(
              -1
            ) === bidNumStr
          );
        }

        // 3 digit bid
        if (
          bidNumStr.length === 3
        ) {
          return (
            winningNumStr ===
            bidNumStr
          );
        }

        return false;

      // ====================================================
      // FULL SANGAM
      // ====================================================

      case "full-sangam":
        return (
          winningNumStr.slice(
            -2
          ) ===
          bidNumStr.padStart(
            2,
            "0"
          )
        );

      // ====================================================
      // LAST DIGIT
      // ====================================================

      case "last-digit":
        return (
          winningNumStr.slice(
            -1
          ) ===
          bidNumStr.slice(-1)
        );

      // ====================================================
      // FIRST DIGIT
      // ====================================================

      case "first-digit":
        return (
          winningNumStr.charAt(
            0
          ) ===
          bidNumStr.charAt(0)
        );

      default:
        return false;
    }
  };

// ==========================================================
// JSON
// ==========================================================

resultSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

resultSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

// ==========================================================
// MODEL
// ==========================================================

module.exports =
  mongoose.models.results ||
  mongoose.model(
    "results",
    resultSchema
  );