const mongoose = require("mongoose");

// ==========================================================
// GAME TYPES
// ==========================================================

const GAME_TYPES = [
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

// ==========================================================
// BID SCHEMA
// ==========================================================

const bidSchema = new mongoose.Schema(
  {
    // ======================================================
    // USER
    // ======================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    // ======================================================
    // MARKET
    // ======================================================

    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: true,
      index: true,
    },

    // ======================================================
    // GAME TYPE
    // ======================================================

    gameType: {
      type: String,
      enum: GAME_TYPES,
      required: true,
      trim: true,
    },

    // ======================================================
    // GAME NUMBER
    // ======================================================

    number: {
      type: String,
      required: true,
      trim: true,

      validate: {
        validator: function (value) {
          const str = String(value).trim();

          switch (this.gameType) {
            // ==================================================
            // JODI
            // 00 - 99
            // ==================================================

            case "jodi":
              return /^[0-9]{2}$/.test(str);

            // ==================================================
            // PANNA
            // 000 - 999
            // ==================================================

            case "panna":
              return /^[0-9]{3}$/.test(str);

            // ==================================================
            // HALF SANGAM
            //
            // 3 DIGIT PANNA + 1 DIGIT
            // Example: 123-5
            //
            // OR
            //
            // 1 DIGIT + 3 DIGIT PANNA
            // Example: 5-123
            // ==================================================

            case "half-sangam":
              return (
                /^[0-9]{3}-[0-9]$/.test(str) ||
                /^[0-9]-[0-9]{3}$/.test(str)
              );

            // ==================================================
            // FULL SANGAM
            //
            // 3 DIGIT PANNA + 3 DIGIT PANNA
            // Example: 123-456
            // ==================================================

            case "full-sangam":
              return /^[0-9]{3}-[0-9]{3}$/.test(str);

            // ==================================================
            // LAST DIGIT
            // 2 DIGIT INPUT
            // ==================================================

            case "last-digit":
              return /^[0-9]{2}$/.test(str);

            // ==================================================
            // FIRST DIGIT
            // 2 DIGIT INPUT
            // ==================================================

            case "first-digit":
              return /^[0-9]{2}$/.test(str);

            default:
              return false;
          }
        },

        message: function () {
          const gameTypeMap = {
            jodi:
              "2-digit number (00-99)",

            panna:
              "3-digit number (000-999)",

            "half-sangam":
              "Panna + Digit (123-5) or Digit + Panna (5-123)",

            "full-sangam":
              "Panna + Panna (123-456)",

            "last-digit":
              "2-digit number (00-99)",

            "first-digit":
              "2-digit number (00-99)",
          };

          return `Invalid number for ${
            this.gameType
          }. Expected format: ${
            gameTypeMap[this.gameType] ||
            "valid number"
          }`;
        },
      },
    },

    // ======================================================
    // BID AMOUNT
    // ======================================================

    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    // ======================================================
    // POSSIBLE WIN AMOUNT
    // ======================================================

    possibleWinAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================================
    // STATUS
    // ======================================================

    status: {
      type: String,
      enum: [
        "pending",
        "won",
        "lost",
        "cancelled",
      ],
      default: "pending",
    },

    // ======================================================
    // WIN AMOUNT
    // ======================================================

    winAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================================
    // RESULT NUMBER
    // ======================================================

    resultNumber: {
      type: String,
      default: null,
    },

    // ======================================================
    // TRANSACTION
    // ======================================================

    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ======================================================
    // REMARKS
    // ======================================================

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

bidSchema.index({
  userId: 1,
  createdAt: -1,
});

bidSchema.index({
  marketId: 1,
  status: 1,
});

bidSchema.index({
  transactionId: 1,
});

bidSchema.index({
  userId: 1,
  status: 1,
});

bidSchema.index({
  marketId: 1,
  createdAt: -1,
});

bidSchema.index({
  marketId: 1,
  gameType: 1,
  status: 1,
});

// ==========================================================
// VIRTUAL
// ==========================================================

bidSchema.virtual("numberDisplay").get(function () {
  return this.number;
});

// ==========================================================
// PRE-VALIDATE
// ==========================================================

bidSchema.pre(
  "validate",
  function (next) {
    if (!this.number) {
      return next();
    }

    const value = String(this.number).trim();

    // ======================================================
    // JODI
    // ======================================================

    if (this.gameType === "jodi") {
      this.number = value.padStart(2, "0");
    }

    // ======================================================
    // LAST DIGIT
    // ======================================================

    else if (this.gameType === "last-digit") {
      this.number = value.padStart(2, "0");
    }

    // ======================================================
    // FIRST DIGIT
    // ======================================================

    else if (this.gameType === "first-digit") {
      this.number = value.padStart(2, "0");
    }

    // ======================================================
    // PANNA
    // ======================================================

    else if (this.gameType === "panna") {
      this.number = value.padStart(3, "0");
    }

    // ======================================================
    // HALF SANGAM
    //
    // IMPORTANT:
    // Do NOT pad the complete string.
    //
    // Valid:
    // 123-5
    // 5-123
    // ======================================================

    else if (this.gameType === "half-sangam") {
      this.number = value;
    }

    // ======================================================
    // FULL SANGAM
    //
    // IMPORTANT:
    // Do NOT pad the complete string.
    //
    // Valid:
    // 123-456
    // ======================================================

    else if (this.gameType === "full-sangam") {
      this.number = value;
    }

  }
);

// ==========================================================
// HELPER
// ==========================================================

function normalizeSangamResult(winningNumber) {
  // --------------------------------------------------------
  // STRING RESULT
  // --------------------------------------------------------

  if (
    typeof winningNumber === "string" ||
    typeof winningNumber === "number"
  ) {
    return String(winningNumber).trim();
  }

  // --------------------------------------------------------
  // OBJECT RESULT
  //
  // Supports common result structures:
  //
  // {
  //   openPanna: "123",
  //   closePanna: "456"
  // }
  //
  // {
  //   openPanna: "123",
  //   closeDigit: "5"
  // }
  //
  // {
  //   openDigit: "5",
  //   closePanna: "123"
  // }
  // --------------------------------------------------------

  if (
    winningNumber &&
    typeof winningNumber === "object"
  ) {
    const openPanna =
      winningNumber.openPanna ??
      winningNumber.openPannaNumber ??
      winningNumber.openPannaResult;

    const closePanna =
      winningNumber.closePanna ??
      winningNumber.closePannaNumber ??
      winningNumber.closePannaResult;

    const openDigit =
      winningNumber.openDigit ??
      winningNumber.open;

    const closeDigit =
      winningNumber.closeDigit ??
      winningNumber.close;

    // ------------------------------------------------------
    // FULL SANGAM
    // ------------------------------------------------------

    if (
      openPanna != null &&
      closePanna != null
    ) {
      return `${String(openPanna).trim()}-${String(
        closePanna
      ).trim()}`;
    }

    // ------------------------------------------------------
    // HALF SANGAM
    //
    // Open Panna + Close Digit
    // ------------------------------------------------------

    if (
      openPanna != null &&
      closeDigit != null
    ) {
      return `${String(openPanna).trim()}-${String(
        closeDigit
      ).trim()}`;
    }

    // ------------------------------------------------------
    // HALF SANGAM
    //
    // Open Digit + Close Panna
    // ------------------------------------------------------

    if (
      openDigit != null &&
      closePanna != null
    ) {
      return `${String(openDigit).trim()}-${String(
        closePanna
      ).trim()}`;
    }

    // ------------------------------------------------------
    // NORMAL RESULT NUMBER
    // ------------------------------------------------------

    if (winningNumber.number != null) {
      return String(
        winningNumber.number
      ).trim();
    }

    if (winningNumber.resultNumber != null) {
      return String(
        winningNumber.resultNumber
      ).trim();
    }
  }

  return "";
}

// ==========================================================
// CHECK WIN
// ==========================================================

bidSchema.methods.checkWin = function (
  winningNumber
) {
  const bidNumStr = String(
    this.number ?? ""
  ).trim();

  if (!bidNumStr) {
    return false;
  }

  const winningNumStr =
    normalizeSangamResult(
      winningNumber
    );

  if (!winningNumStr) {
    return false;
  }

  // ========================================================
  // JODI
  // ========================================================

  if (this.gameType === "jodi") {
    return winningNumStr === bidNumStr;
  }

  // ========================================================
  // PANNA
  // ========================================================

  if (this.gameType === "panna") {
    return winningNumStr === bidNumStr;
  }

  // ========================================================
  // HALF SANGAM
  //
  // USER:
  //
  // 123-5
  //
  // RESULT:
  //
  // 123-5
  //
  // OR
  //
  // USER:
  //
  // 5-123
  //
  // RESULT:
  //
  // 5-123
  //
  // EXACT MATCH REQUIRED
  // ========================================================

  if (this.gameType === "half-sangam") {
    const bidParts = bidNumStr.split("-");
    const resultParts =
      winningNumStr.split("-");

    // Must have exactly 2 parts
    if (
      bidParts.length !== 2 ||
      resultParts.length !== 2
    ) {
      return false;
    }

    const bidFirst = bidParts[0];
    const bidSecond = bidParts[1];

    const resultFirst = resultParts[0];
    const resultSecond = resultParts[1];

    // ------------------------------------------------------
    // 3 DIGIT PANNA + 1 DIGIT
    //
    // 123-5
    // ------------------------------------------------------

    if (
      bidFirst.length === 3 &&
      bidSecond.length === 1
    ) {
      return (
        resultFirst.length === 3 &&
        resultSecond.length === 1 &&
        resultFirst === bidFirst &&
        resultSecond === bidSecond
      );
    }

    // ------------------------------------------------------
    // 1 DIGIT + 3 DIGIT PANNA
    //
    // 5-123
    // ------------------------------------------------------

    if (
      bidFirst.length === 1 &&
      bidSecond.length === 3
    ) {
      return (
        resultFirst.length === 1 &&
        resultSecond.length === 3 &&
        resultFirst === bidFirst &&
        resultSecond === bidSecond
      );
    }

    return false;
  }

  // ========================================================
  // FULL SANGAM
  //
  // USER:
  //
  // 123-456
  //
  // RESULT:
  //
  // 123-456
  //
  // BOTH PANNA MUST MATCH
  // ========================================================

  if (this.gameType === "full-sangam") {
    const bidParts = bidNumStr.split("-");
    const resultParts =
      winningNumStr.split("-");

    // Must have exactly 2 parts
    if (
      bidParts.length !== 2 ||
      resultParts.length !== 2
    ) {
      return false;
    }

    const bidOpenPanna = bidParts[0];
    const bidClosePanna = bidParts[1];

    const resultOpenPanna =
      resultParts[0];

    const resultClosePanna =
      resultParts[1];

    // Both sides must be 3 digit
    if (
      bidOpenPanna.length !== 3 ||
      bidClosePanna.length !== 3 ||
      resultOpenPanna.length !== 3 ||
      resultClosePanna.length !== 3
    ) {
      return false;
    }

    return (
      bidOpenPanna === resultOpenPanna &&
      bidClosePanna === resultClosePanna
    );
  }

  // ========================================================
  // LAST DIGIT
  // ========================================================

  if (this.gameType === "last-digit") {
    const bidLastDigit =
      bidNumStr.slice(-1);

    const winningLastDigit =
      winningNumStr.slice(-1);

    return (
      bidLastDigit ===
      winningLastDigit
    );
  }

  // ========================================================
  // FIRST DIGIT
  // ========================================================

  if (this.gameType === "first-digit") {
    const bidFirstDigit =
      bidNumStr.charAt(0);

    const winningFirstDigit =
      winningNumStr.charAt(0);

    return (
      bidFirstDigit ===
      winningFirstDigit
    );
  }

  return false;
};

// ==========================================================
// STATIC - BID STATISTICS
// ==========================================================

bidSchema.statics.getStats =
  async function (userId) {
    const stats =
      await this.aggregate([
        {
          $match: {
            userId:
              new mongoose.Types.ObjectId(
                userId
              ),
          },
        },

        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$bidAmount",
            },

            totalWinAmount: {
              $sum: "$winAmount",
            },
          },
        },
      ]);

    return stats;
  };

// ==========================================================
// EXPORT
// ==========================================================

module.exports = mongoose.model(
  "bids",
  bidSchema
);