const Result = require("../models/Result");
const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");

// ============================================================
// GAME TYPES
// ============================================================

const TWO_DIGIT_GAME_TYPES = Object.freeze([
  "jodi",
  "last-digit",
  "first-digit",
]);

const THREE_DIGIT_GAME_TYPES = Object.freeze([
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
]);

const VALID_DIGIT_TYPES = Object.freeze([
  "2-digit",
  "3-digit",
]);

// ============================================================
// HELPER: SAFE SESSION END
// ============================================================

const endSession = async (session) => {
  try {
    await session.endSession();
  } catch (error) {
    console.error("Session End Error:", error);
  }
};

// ============================================================
// ================= DECLARE RESULT ============================
// ============================================================

exports.declareResult = async (req, res) => {
  const session = await mongoose.startSession();

  const str = (value) => {
    if (value === undefined || value === null) {
      return "";
    }
    return String(value).trim();
  };

  const getFirstDigit = (value) => {
    const valueStr = str(value);
    if (!valueStr) return "";
    return valueStr.charAt(0);
  };

  // ============================================================
  // JODI RESULT LOGIC
  // ============================================================
  // 2-digit result:
  //   36 -> 36
  //   63 -> 63
  //
  // Full Sangam:
  //   123-456 -> 36
  //   456-123 -> 63
  //
  // Full Sangam me:
  // First Panna ka LAST digit
  // +
  // Second Panna ka LAST digit
  //
  // Order preserve rahega.
  const getJodi = (value) => {
    const valueStr = str(value);
    if (!valueStr) return "";

    // Full Sangam: Panna-Panna
    const sangamParts = valueStr.split("-");

    if (
      sangamParts.length === 2 &&
      /^\d{3}$/.test(sangamParts[0].trim()) &&
      /^\d{3}$/.test(sangamParts[1].trim())
    ) {
      const firstPanna = sangamParts[0].trim();
      const secondPanna = sangamParts[1].trim();

      return (
        firstPanna.charAt(firstPanna.length - 1) +
        secondPanna.charAt(secondPanna.length - 1)
      );
    }

    // Normal 2-digit Jodi result
    if (/^\d{2}$/.test(valueStr)) {
      return valueStr;
    }

    // 3-digit value
    if (/^\d{3}$/.test(valueStr)) {
      return valueStr.substring(0, 2);
    }

    return "";
  };

  // ============================================================
  // HALF SANGAM NORMALIZER
  // Supports:
  //   123-6
  //   6-123
  // ============================================================

  const normalizeHalfSangam = (value) => {
    const input = str(value);
    if (!input) return null;

    const parts = input.split("-");

    if (parts.length !== 2) return null;

    const left = parts[0].trim();
    const right = parts[1].trim();

    // 123-6
    if (/^\d{3}$/.test(left) && /^\d$/.test(right)) {
      return {
        panna: left,
        digit: right,
      };
    }

    // 6-123
    if (/^\d$/.test(left) && /^\d{3}$/.test(right)) {
      return {
        panna: right,
        digit: left,
      };
    }

    return null;
  };

  const checkHalfSangamWin = (bidNumber, winningNumber) => {
    const bid = normalizeHalfSangam(bidNumber);
    const winning = normalizeHalfSangam(winningNumber);

    if (!bid || !winning) return false;

    return (
      bid.panna === winning.panna &&
      bid.digit === winning.digit
    );
  };

  // ============================================================
  // CHECK BID WIN
  // ============================================================

  const checkBidWin = (bid, formattedWinningNumbers) => {
    if (!bid) return false;

    const gameType = str(bid.gameType).toLowerCase();
    const bidNumber = str(bid.number);

    if (!gameType || !bidNumber) return false;

    const winningNumber = formattedWinningNumbers[gameType];

    if (
      winningNumber === undefined ||
      winningNumber === null ||
      str(winningNumber) === ""
    ) {
      return false;
    }

    // ==========================================================
    // FIRST DIGIT
    // ==========================================================

    if (gameType === "first-digit") {
      const resultFirstDigit = getFirstDigit(winningNumber);
      const bidFirstDigit = getFirstDigit(bidNumber);

      return bidFirstDigit === resultFirstDigit;
    }

    // ==========================================================
    // JODI
    // ==========================================================

    if (gameType === "jodi") {
      const resultJodi = getJodi(winningNumber);
      const bidJodi = getJodi(bidNumber);

      return (
        resultJodi !== "" &&
        bidJodi !== "" &&
        bidJodi === resultJodi
      );
    }

    // ==========================================================
    // LAST DIGIT
    // ==========================================================

    if (gameType === "last-digit") {
      const resultStr = str(winningNumber);
      const bidStr = str(bidNumber);

      if (!resultStr || !bidStr) return false;

      return (
        bidStr.charAt(bidStr.length - 1) ===
        resultStr.charAt(resultStr.length - 1)
      );
    }

    // ==========================================================
    // PANNA
    // ==========================================================

    if (gameType === "panna") {
      const resultStr = str(winningNumber);
      const bidStr = str(bidNumber);

      if (!/^\d{3}$/.test(resultStr)) return false;
      if (!/^\d{3}$/.test(bidStr)) return false;

      return bidStr === resultStr;
    }

    // ==========================================================
    // HALF SANGAM
    // ==========================================================

    if (gameType === "half-sangam") {
      return checkHalfSangamWin(
        bidNumber,
        winningNumber
      );
    }

    // ==========================================================
    // FULL SANGAM
    // ==========================================================

    if (gameType === "full-sangam") {
      return str(bidNumber) === str(winningNumber);
    }

    return false;
  };

  try {
    session.startTransaction();

    // ============================================================
    // REQUEST BODY
    // ============================================================

    const {
      marketId,
      winningNumbers,
      resultDate,
      nextOpenDate,
      digitType: requestedDigitType,
    } = req.body;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!marketId) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Market ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(marketId)) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid Market ID",
      });
    }

    if (
      !winningNumbers ||
      typeof winningNumbers !== "object" ||
      Array.isArray(winningNumbers)
    ) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Winning numbers object is required",
      });
    }

    if (!nextOpenDate) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Next open date is required",
      });
    }

    const parsedResultDate = resultDate
      ? new Date(resultDate)
      : new Date();

    const parsedNextOpenDate = new Date(nextOpenDate);

    if (Number.isNaN(parsedResultDate.getTime())) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid result date",
      });
    }

    if (Number.isNaN(parsedNextOpenDate.getTime())) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid next open date",
      });
    }

    if (
      parsedNextOpenDate.getTime() <=
      parsedResultDate.getTime()
    ) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Next open date must be after result date",
      });
    }

    // ============================================================
    // GET MARKET
    // ============================================================

    const market = await Market.findById(marketId)
      .session(session);

    if (!market) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // ============================================================
    // DIGIT TYPE
    // ============================================================

    const VALID_DIGIT_TYPES = [
      "2-digit",
      "3-digit",
    ];

    let digitType = market.digitType;

    if (!VALID_DIGIT_TYPES.includes(digitType)) {
      if (
        VALID_DIGIT_TYPES.includes(
          requestedDigitType
        )
      ) {
        market.digitType = requestedDigitType;
        digitType = requestedDigitType;
      }
    }

    if (!VALID_DIGIT_TYPES.includes(digitType)) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Market digit type must be 2-digit or 3-digit",
      });
    }

    // ============================================================
    // ALLOWED GAME TYPES
    // ============================================================

    const TWO_DIGIT_GAME_TYPES = [
      "jodi",
      "last-digit",
      "first-digit",
    ];

    const THREE_DIGIT_GAME_TYPES = [
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    const allowedGameTypes =
      digitType === "2-digit"
        ? TWO_DIGIT_GAME_TYPES
        : THREE_DIGIT_GAME_TYPES;

    // ============================================================
    // RESULT ALREADY DECLARED
    // ============================================================

    if (market.isResultDeclared) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Result already declared for this market",
      });
    }

    // ============================================================
    // VALIDATE GAME TYPES
    // ============================================================

    const invalidGameTypes =
      Object.keys(winningNumbers).filter(
        (gameType) => {
          const value = winningNumbers[gameType];

          if (
            value === undefined ||
            value === null ||
            str(value) === ""
          ) {
            return false;
          }

          return !allowedGameTypes.includes(
            gameType
          );
        }
      );

    if (invalidGameTypes.length > 0) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Invalid game type for this market",
        invalidGameTypes,
        allowedGameTypes,
        digitType,
      });
    }

    // ============================================================
    // FORMAT WINNING NUMBERS
    // ============================================================

    const formattedWinningNumbers = {};
    const errors = [];

    for (const gameType of allowedGameTypes) {
      const number = winningNumbers[gameType];

      if (
        number === undefined ||
        number === null ||
        str(number) === ""
      ) {
        formattedWinningNumbers[gameType] = null;
        continue;
      }

      try {
        formattedWinningNumbers[gameType] =
          Result.formatWinningNumber(
            number,
            gameType
          );
      } catch (error) {
        errors.push(
          `${gameType}: ${error.message}`
        );
      }
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid winning numbers",
        errors,
      });
    }

    // ============================================================
    // AT LEAST ONE RESULT REQUIRED
    // ============================================================

    const hasWinningNumber =
      Object.values(
        formattedWinningNumbers
      ).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          str(value) !== ""
      );

    if (!hasWinningNumber) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "At least one winning number is required",
      });
    }

    // ============================================================
    // FIND ALL PENDING BIDS
    // ============================================================

    const pendingBids = await Bid.find({
      marketId,
      status: "pending",
    }).session(session);

    if (pendingBids.length === 0) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "No pending bids found for this market",
      });
    }

    // ============================================================
    // PROCESS BIDS
    // ============================================================

    let totalWon = 0;
    let totalLost = 0;
    let totalPayout = 0;

    const winningBidsList = [];
    const gameTypeStats = {};

    for (const type of allowedGameTypes) {
      gameTypeStats[type] = {
        won: 0,
        lost: 0,
        total: 0,
      };
    }

    // ============================================================
    // PROCESS EVERY BID
    // ============================================================

    for (const bid of pendingBids) {

      // ----------------------------------------------------------
      // INVALID / OLD GAME TYPE
      // ----------------------------------------------------------

      if (!allowedGameTypes.includes(bid.gameType)) {
        bid.status = "lost";
        bid.lostAt = new Date();
        bid.winAmount = 0;
        bid.resultNumber = null;
        bid.nextOpenDate =
          parsedNextOpenDate;

        await bid.save({ session });

        totalLost++;
        continue;
      }

      // ----------------------------------------------------------
      // TOTAL GAME TYPE BIDS
      // ----------------------------------------------------------

      if (gameTypeStats[bid.gameType]) {
        gameTypeStats[
          bid.gameType
        ].total++;
      }

      // ----------------------------------------------------------
      // CHECK WIN
      // ----------------------------------------------------------

      const isWin = checkBidWin(
        bid,
        formattedWinningNumbers
      );

      // ==========================================================
      // WON
      // ==========================================================

      if (isWin) {
        bid.status = "won";

        bid.winAmount =
          Number(
            bid.possibleWinAmount
          ) || 0;

        bid.wonAt = new Date();

        bid.resultNumber =
          formattedWinningNumbers[
            bid.gameType
          ] || null;

        // --------------------------------------------------------
        // GET USER
        // --------------------------------------------------------

        const user = await User.findById(
          bid.userId
        ).session(session);

        if (user) {
          user.balance =
            (Number(user.balance) || 0) +
            (Number(
              bid.possibleWinAmount
            ) || 0);

          await user.save({ session });

          totalPayout +=
            Number(
              bid.possibleWinAmount
            ) || 0;
        }

        totalWon++;

        winningBidsList.push(bid);

        if (gameTypeStats[bid.gameType]) {
          gameTypeStats[
            bid.gameType
          ].won++;
        }

      }

      // ==========================================================
      // LOST
      // ==========================================================

      else {
        bid.status = "lost";
        bid.winAmount = 0;
        bid.lostAt = new Date();

        bid.resultNumber =
          formattedWinningNumbers[
            bid.gameType
          ] || null;

        totalLost++;

        if (gameTypeStats[bid.gameType]) {
          gameTypeStats[
            bid.gameType
          ].lost++;
        }
      }

      // ============================================================
      // SET NEXT OPEN DATE
      // ============================================================

      bid.nextOpenDate =
        parsedNextOpenDate;

      // ============================================================
      // SAVE BID
      // ============================================================

      await bid.save({ session });
    }

    // ============================================================
    // CREATE RESULT DATA
    // ============================================================

    const resultData = {
      marketId: market._id,
      marketName: market.name,
      digitType,
      winningNumber:
        formattedWinningNumbers,
      resultDate: parsedResultDate,
      nextOpenDate:
        parsedNextOpenDate,
      declaredBy: req.user.id,
      totalBids:
        pendingBids.length,
      totalWinningBids:
        totalWon,
      totalPayout,
      status: "declared",
    };

    // ============================================================
    // SAVE RESULT
    // ============================================================

    const result = await Result.create(
      [resultData],
      { session }
    );

    // ============================================================
    // UPDATE ALL BIDS NEXT OPEN DATE
    // ============================================================

    await Bid.updateMany(
      {
        marketId: market._id,
      },
      {
        $set: {
          nextOpenDate:
            parsedNextOpenDate,
        },
      },
      {
        session,
      }
    );

    // ============================================================
    // UPDATE MARKET
    // ============================================================

    market.isResultDeclared = true;
    market.resultDeclaredAt = new Date();

    await market.save({ session });

    // ============================================================
    // COMMIT
    // ============================================================

    await session.commitTransaction();
    await session.endSession();

    // ============================================================
    // SUCCESS
    // ============================================================

    return res.json({
      success: true,
      message:
        "Result declared successfully",

      data: {
        market: {
          id: market._id,
          name: market.name,
          digitType,
        },

        result: result[0],

        resultDate:
          parsedResultDate,

        nextOpenDate:
          parsedNextOpenDate,

        summary: {
          digitType,
          allowedGameTypes,
          totalBidsProcessed:
            pendingBids.length,
          totalWon,
          totalLost,
          totalPayout,
          gameTypeStats,
        },

        winningBids:
          winningBidsList.map(
            (bid) => ({
              id: bid._id,
              userId: bid.userId,
              gameType:
                bid.gameType,
              number: bid.number,
              bidAmount:
                bid.bidAmount,
              winAmount:
                bid.winAmount,
              nextOpenDate:
                parsedNextOpenDate,
            })
          ),
      },
    });

  } catch (error) {

    // ============================================================
    // ROLLBACK
    // ============================================================

    try {
      await session.abortTransaction();
    } catch (abortError) {
      console.error(
        "Transaction Abort Error:",
        abortError
      );
    }

    await session.endSession();

    console.error(
      "Declare Result Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
};

// ============================================================
// ================= GET RESULTS ================================
// ============================================================

exports.getResults = async (
  req,
  res
) => {
  try {
    const {
      marketId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (marketId) {
      filter.marketId = marketId;
    }

    if (startDate || endDate) {
      filter.resultDate = {};

      if (startDate) {
        const parsedStartDate =
          new Date(startDate);

        if (
          !Number.isNaN(
            parsedStartDate.getTime()
          )
        ) {
          filter.resultDate.$gte =
            parsedStartDate;
        }
      }

      if (endDate) {
        const parsedEndDate =
          new Date(endDate);

        if (
          !Number.isNaN(
            parsedEndDate.getTime()
          )
        ) {
          filter.resultDate.$lte =
            parsedEndDate;
        }
      }
    }

    const parsedPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const parsedLimit = Math.max(
      parseInt(limit, 10) || 20,
      1
    );

    const results =
      await Result.find(filter)
        .populate(
          "marketId",
          "name marketId digitType"
        )
        .populate(
          "declaredBy",
          "name email"
        )
        .sort({
          resultDate: -1,
        })
        .skip(
          (parsedPage - 1) *
          parsedLimit
        )
        .limit(parsedLimit);

    const total =
      await Result.countDocuments(filter);

    return res.json({
      success: true,

      data: results,

      pagination: {
        page: parsedPage,

        limit: parsedLimit,

        total,

        pages: Math.ceil(
          total / parsedLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get Results Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
};

// ============================================================
// ================= GET RESULT BY ID ==========================
// ============================================================

exports.getResultById = async (
  req,
  res
) => {
  try {
    const {
      resultId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        resultId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID",
      });
    }

    const result =
      await Result.findById(
        resultId
      )
        .populate(
          "marketId",
          "name marketId digitType"
        )
        .populate(
          "declaredBy",
          "name email"
        );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    const actualMarketId =
      result.marketId?._id ||
      result.marketId;

    const winningBids =
      await Bid.find({
        marketId: actualMarketId,
        status: "won",
      })
        .populate(
          "userId",
          "name email mobile"
        )
        .select(
          "userId gameType number bidAmount winAmount"
        );

    return res.json({
      success: true,

      data: {
        result,

        winningBids,

        totalWinners:
          winningBids.length,
      },
    });
  } catch (error) {
    console.error(
      "Get Result By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
};

// ============================================================
// ================= GET TODAY'S RESULTS =======================
// ============================================================

exports.getTodayResults = async (
  req,
  res
) => {
  try {
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const tomorrow =
      new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const results =
      await Result.find({
        resultDate: {
          $gte: today,
          $lt: tomorrow,
        },
      })
        .populate(
          "marketId",
          "name marketId digitType"
        )
        .sort({
          resultDate: -1,
        });

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(
      "Get Today Results Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
};

// ============================================================
// ================= GET RESULT STATISTICS =====================
// ============================================================

exports.getResultStats = async (
  req,
  res
) => {
  try {
    const stats =
      await Result.aggregate([
        {
          $group: {
            _id: "$marketId",

            totalResults: {
              $sum: 1,
            },

            totalPayout: {
              $sum: "$totalPayout",
            },

            totalWinningBids: {
              $sum: "$totalWinningBids",
            },

            avgPayout: {
              $avg: "$totalPayout",
            },
          },
        },

        {
          $lookup: {
            from: "markets",

            localField: "_id",

            foreignField: "_id",

            as: "market",
          },
        },

        {
          $unwind: "$market",
        },

        {
          $project: {
            _id: 0,

            marketId: "$_id",

            marketName: "$market.name",

            digitType: "$market.digitType",

            totalResults: 1,

            totalPayout: 1,

            totalWinningBids: 1,

            avgPayout: {
              $round: [
                "$avgPayout",
                2,
              ],
            },
          },
        },

        {
          $sort: {
            totalResults: -1,
          },
        },
      ]);

    // ==========================================================
    // OVERALL STATS
    // ==========================================================

    const overallStats =
      await Result.aggregate([
        {
          $group: {
            _id: null,

            totalResults: {
              $sum: 1,
            },

            totalPayout: {
              $sum: "$totalPayout",
            },

            totalWinningBids: {
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

    return res.json({
      success: true,

      data: {
        byMarket: stats,

        overall:
          overallStats[0] || {
            totalResults: 0,
            totalPayout: 0,
            totalWinningBids: 0,
            totalBids: 0,
            avgPayout: 0,
          },
      },
    });
  } catch (error) {
    console.error(
      "Get Result Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
};