const mongoose = require("mongoose");

// ==========================================================
// GAME TYPES
// ==========================================================

const GAME_TYPES = [
  "single",
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

// ==========================================================
// WINNING NUMBERS SCHEMA
// ==========================================================

const winningNumbersSchema = new mongoose.Schema(
  {
    single: {
      type: String,
      default: null,
    },

    jodi: {
      type: String,
      default: null,
    },

    panna: {
      type: String,
      default: null,
    },

    "half-sangam": {
      type: String,
      default: null,
    },

    "full-sangam": {
      type: String,
      default: null,
    },

    "last-digit": {
      type: String,
      default: null,
    },

    "first-digit": {
      type: String,
      default: null,
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

// ==========================================================
// STATIC: FORMAT WINNING NUMBER
// ==========================================================

resultSchema.statics.formatWinningNumber = function (
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

  let number = String(value).trim();

  switch (gameType) {
    case "single":
      if (!/^[0-9]$/.test(number)) {
        throw new Error(
          "Single winning number must be 0-9"
        );
      }

      return number;

    case "jodi":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "Jodi winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    case "panna":
      if (!/^[0-9]{1,3}$/.test(number)) {
        throw new Error(
          "Panna winning number must be 000-999"
        );
      }

      return number.padStart(3, "0");

    case "half-sangam":
      if (!/^[0-9]{1,3}$/.test(number)) {
        throw new Error(
          "Half Sangam winning number must be 1-3 digits"
        );
      }

      return number;

    case "full-sangam":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "Full Sangam winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    case "last-digit":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "Last digit winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    case "first-digit":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "First digit winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    default:
      throw new Error(
        `Invalid game type: ${gameType}`
      );
  }
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

    const stats = await this.aggregate([
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
  }
);

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
      winningNumber === undefined ||
      winningNumber === null
    ) {
      return false;
    }

    const winningNumStr =
      String(winningNumber).trim();

    const bidNumStr =
      String(bidNumber).trim();

    switch (bidGameType) {
      case "single":
        return (
          winningNumStr === bidNumStr
        );

      case "jodi":
        return (
          winningNumStr ===
          bidNumStr.padStart(2, "0")
        );

      case "panna":
        return (
          winningNumStr ===
          bidNumStr.padStart(3, "0")
        );

      case "half-sangam":
        return (
          winningNumStr ===
            bidNumStr ||
          winningNumStr.slice(-1) ===
            bidNumStr.slice(-1)
        );

      case "full-sangam":
        return (
          winningNumStr.slice(-2) ===
          bidNumStr.padStart(2, "0")
        );

      case "last-digit":
        return (
          winningNumStr.slice(-1) ===
          bidNumStr.slice(-1)
        );

      case "first-digit":
        return (
          winningNumStr.charAt(0) ===
          bidNumStr.charAt(0)
        );

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