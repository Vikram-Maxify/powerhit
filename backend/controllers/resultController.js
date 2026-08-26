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

  try {
    session.startTransaction();

    const {
      marketId,
      winningNumbers,
      resultDate,
      nextOpenDate,
      digitType: requestedDigitType,
    } = req.body;

    // ============================================================
    // VALIDATE MARKET ID
    // ============================================================

    if (!marketId) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Market ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(marketId)) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Invalid Market ID",
      });
    }

    // ============================================================
    // VALIDATE WINNING NUMBERS
    // ============================================================

    if (
      !winningNumbers ||
      typeof winningNumbers !== "object" ||
      Array.isArray(winningNumbers)
    ) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Winning numbers object is required",
      });
    }

    // ============================================================
    // VALIDATE NEXT OPEN DATE
    // ============================================================

    if (!nextOpenDate) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Next open date is required",
      });
    }

    // ============================================================
    // PARSE DATES
    // ============================================================

    const parsedResultDate = resultDate
      ? new Date(resultDate)
      : new Date();

    const parsedNextOpenDate = new Date(nextOpenDate);

    // ============================================================
    // VALIDATE RESULT DATE
    // ============================================================

    if (Number.isNaN(parsedResultDate.getTime())) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Invalid result date",
      });
    }

    // ============================================================
    // VALIDATE NEXT OPEN DATE
    // ============================================================

    if (Number.isNaN(parsedNextOpenDate.getTime())) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Invalid next open date",
      });
    }

    // ============================================================
    // NEXT OPEN DATE MUST BE AFTER RESULT DATE
    // ============================================================

    if (
      parsedNextOpenDate.getTime() <=
      parsedResultDate.getTime()
    ) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Next open date must be after result date",
      });
    }

    // ============================================================
    // FIND MARKET
    // ============================================================

    const market = await Market.findById(marketId).session(session);

    if (!market) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // ============================================================
    // GET MARKET DIGIT TYPE
    // ============================================================

    let digitType = market.digitType;

    // Allow old market to be repaired from request
    if (!VALID_DIGIT_TYPES.includes(digitType)) {
      if (VALID_DIGIT_TYPES.includes(requestedDigitType)) {
        market.digitType = requestedDigitType;
        digitType = requestedDigitType;
      }
    }

    if (!VALID_DIGIT_TYPES.includes(digitType)) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Market digit type must be 2-digit or 3-digit",
      });
    }

    // ============================================================
    // ALLOWED GAME TYPES
    // ============================================================

    const allowedGameTypes =
      digitType === "2-digit"
        ? TWO_DIGIT_GAME_TYPES
        : THREE_DIGIT_GAME_TYPES;

    // ============================================================
    // CHECK RESULT ALREADY DECLARED
    // ============================================================

    if (market.isResultDeclared) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // ============================================================
    // VALIDATE GAME TYPES
    // ============================================================

    const invalidGameTypes = Object.keys(winningNumbers).filter(
      (gameType) => {
        const value = winningNumbers[gameType];

        // Ignore empty values
        if (
          value === undefined ||
          value === null ||
          String(value).trim() === ""
        ) {
          return false;
        }

        return !allowedGameTypes.includes(gameType);
      }
    );

    if (invalidGameTypes.length > 0) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Invalid game type for this market",
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

      // Empty game allowed
      if (
        number === undefined ||
        number === null ||
        String(number).trim() === ""
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
        errors.push(`${gameType}: ${error.message}`);
      }
    }

    // ============================================================
    // NUMBER VALIDATION ERROR
    // ============================================================

    if (errors.length > 0) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "Invalid winning numbers",
        errors,
      });
    }

    // ============================================================
    // AT LEAST ONE RESULT REQUIRED
    // ============================================================

    const hasWinningNumber = Object.values(
      formattedWinningNumbers
    ).some(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    );

    if (!hasWinningNumber) {
      await session.abortTransaction();
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "At least one winning number is required",
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
      await endSession(session);

      return res.status(400).json({
        success: false,
        message: "No pending bids found for this market",
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
        bid.nextOpenDate = parsedNextOpenDate;

        await bid.save({
          session,
        });

        totalLost++;

        continue;
      }

      // ----------------------------------------------------------
      // TOTAL GAME TYPE BIDS
      // ----------------------------------------------------------

      if (gameTypeStats[bid.gameType]) {
        gameTypeStats[bid.gameType].total++;
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
          Number(bid.possibleWinAmount) || 0;

        bid.wonAt = new Date();

        bid.resultNumber =
          formattedWinningNumbers[bid.gameType] || null;

        // --------------------------------------------------------
        // GET USER
        // --------------------------------------------------------

        const user = await User.findById(
          bid.userId
        ).session(session);

        if (user) {
          user.balance =
            (Number(user.balance) || 0) +
            (Number(bid.possibleWinAmount) || 0);

          await user.save({
            session,
          });

          totalPayout +=
            Number(bid.possibleWinAmount) || 0;
        }

        totalWon++;

        winningBidsList.push(bid);

        // --------------------------------------------------------
        // GAME TYPE WON
        // --------------------------------------------------------

        if (gameTypeStats[bid.gameType]) {
          gameTypeStats[bid.gameType].won++;
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
          formattedWinningNumbers[bid.gameType] || null;

        totalLost++;

        // --------------------------------------------------------
        // GAME TYPE LOST
        // --------------------------------------------------------

        if (gameTypeStats[bid.gameType]) {
          gameTypeStats[bid.gameType].lost++;
        }
      }

      // ==========================================================
      // SET NEXT OPEN DATE
      // ==========================================================

      bid.nextOpenDate = parsedNextOpenDate;

      // ==========================================================
      // SAVE BID
      // ==========================================================

      await bid.save({
        session,
      });
    }

    // ============================================================
    // CREATE RESULT DATA
    // ============================================================

    const resultData = {
      marketId: market._id,

      marketName: market.name,

      digitType,

      winningNumber: formattedWinningNumbers,

      resultDate: parsedResultDate,

      nextOpenDate: parsedNextOpenDate,

      declaredBy: req.user.id,

      totalBids: pendingBids.length,

      totalWinningBids: totalWon,

      totalPayout,

      status: "declared",
    };

    // ============================================================
    // SAVE RESULT
    // ============================================================

    const result = await Result.create(
      [resultData],
      {
        session,
      }
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
          nextOpenDate: parsedNextOpenDate,
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

    await market.save({
      session,
    });

    // ============================================================
    // COMMIT
    // ============================================================

    await session.commitTransaction();
    await endSession(session);

    // ============================================================
    // SUCCESS
    // ============================================================

    return res.json({
      success: true,

      message: "Result declared successfully",

      data: {
        market: {
          id: market._id,
          name: market.name,
          digitType,
        },

        result: result[0],

        resultDate: parsedResultDate,

        nextOpenDate: parsedNextOpenDate,

        summary: {
          digitType,

          allowedGameTypes,

          totalBidsProcessed: pendingBids.length,

          totalWon,

          totalLost,

          totalPayout,

          gameTypeStats,
        },

        winningBids: winningBidsList.map(
          (bid) => ({
            id: bid._id,

            userId: bid.userId,

            gameType: bid.gameType,

            number: bid.number,

            bidAmount: bid.bidAmount,

            winAmount: bid.winAmount,

            nextOpenDate: parsedNextOpenDate,
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

    await endSession(session);

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
// ================= HELPER: CHECK BID WIN =====================
// ============================================================

const checkBidWin = (
  bid,
  winningNumbers
) => {
  // ============================================================
  // GET WINNING NUMBER
  // ============================================================

  const winningNumber =
    winningNumbers[bid.gameType];

  if (
    winningNumber === undefined ||
    winningNumber === null ||
    String(winningNumber).trim() === ""
  ) {
    return false;
  }

  // ============================================================
  // NORMALIZE VALUES
  // ============================================================

  const winningNumStr = String(
    winningNumber
  ).trim();

  const bidNumStr = String(
    bid.number
  ).trim();

  if (!bidNumStr) {
    return false;
  }

  // ============================================================
  // GAME TYPE MATCHING
  // ============================================================

  switch (bid.gameType) {

    // ============================================================
    // JODI
    // ============================================================
    //
    // IMPORTANT:
    //
    // Jodi bid ke FIRST 2 DIGITS ko result ke FIRST 2 DIGITS
    // se match karega.
    //
    // Bid    = 12
    // Result = 123456
    // FIRST 2 = 12
    // => WIN
    //
    // Bid    = 12
    // Result = 129876
    // FIRST 2 = 12
    // => WIN
    //
    // Bid    = 12
    // Result = 132456
    // FIRST 2 = 13
    // => LOST
    //
    // ============================================================

    case "jodi": {
      const bidFirstTwo =
        bidNumStr.slice(0, 2);

      const resultFirstTwo =
        winningNumStr.slice(0, 2);

      return (
        bidFirstTwo.length === 2 &&
        resultFirstTwo.length === 2 &&
        /^\d{2}$/.test(bidFirstTwo) &&
        /^\d{2}$/.test(resultFirstTwo) &&
        bidFirstTwo === resultFirstTwo
      );
    }

    // ============================================================
    // PANNA
    // ============================================================

    case "panna": {
      const bidPanna =
        bidNumStr.padStart(3, "0");

      const resultPanna =
        winningNumStr.padStart(3, "0");

      return (
        bidPanna.length === 3 &&
        resultPanna.length === 3 &&
        /^\d{3}$/.test(bidPanna) &&
        /^\d{3}$/.test(resultPanna) &&
        bidPanna === resultPanna
      );
    }

    // ============================================================
    // HALF SANGAM
    // ============================================================

    case "half-sangam": {
      const bidParts =
        bidNumStr.split("-");

      const resultParts =
        winningNumStr.split("-");

      if (
        bidParts.length !== 2 ||
        resultParts.length !== 2
      ) {
        return false;
      }

      const bidFirst =
        bidParts[0].trim();

      const bidSecond =
        bidParts[1].trim();

      const resultFirst =
        resultParts[0].trim();

      const resultSecond =
        resultParts[1].trim();

      // ----------------------------------------------------------
      // PANNA + DIGIT
      // Example: 123-6
      // ----------------------------------------------------------

      if (
        /^\d{3}$/.test(bidFirst) &&
        /^\d$/.test(bidSecond)
      ) {
        return (
          /^\d{3}$/.test(resultFirst) &&
          /^\d$/.test(resultSecond) &&
          bidFirst === resultFirst &&
          bidSecond === resultSecond
        );
      }

      // ----------------------------------------------------------
      // DIGIT + PANNA
      // Example: 6-123
      // ----------------------------------------------------------

      if (
        /^\d$/.test(bidFirst) &&
        /^\d{3}$/.test(bidSecond)
      ) {
        return (
          /^\d$/.test(resultFirst) &&
          /^\d{3}$/.test(resultSecond) &&
          bidFirst === resultFirst &&
          bidSecond === resultSecond
        );
      }

      return false;
    }

    // ============================================================
    // FULL SANGAM
    // ============================================================

    case "full-sangam": {
      const bidParts =
        bidNumStr.split("-");

      const resultParts =
        winningNumStr.split("-");

      if (
        bidParts.length !== 2 ||
        resultParts.length !== 2
      ) {
        return false;
      }

      const bidFirst =
        bidParts[0].trim();

      const bidSecond =
        bidParts[1].trim();

      const resultFirst =
        resultParts[0].trim();

      const resultSecond =
        resultParts[1].trim();

      if (
        !/^\d{3}$/.test(bidFirst) ||
        !/^\d{3}$/.test(bidSecond) ||
        !/^\d{3}$/.test(resultFirst) ||
        !/^\d{3}$/.test(resultSecond)
      ) {
        return false;
      }

      return (
        bidFirst === resultFirst &&
        bidSecond === resultSecond
      );
    }

    // ============================================================
    // LAST DIGIT
    // ============================================================

    case "last-digit": {
      const bidLastDigit =
        bidNumStr.match(/\d$/)?.[0];

      const resultLastDigit =
        winningNumStr.match(/\d$/)?.[0];

      return (
        bidLastDigit !== undefined &&
        resultLastDigit !== undefined &&
        bidLastDigit === resultLastDigit
      );
    }

    // ============================================================
    // FIRST DIGIT
    // ============================================================

    case "first-digit": {
      const bidFirstDigit =
        bidNumStr.match(/^\d/)?.[0];

      const resultFirstDigit =
        winningNumStr.match(/^\d/)?.[0];

      return (
        bidFirstDigit !== undefined &&
        resultFirstDigit !== undefined &&
        bidFirstDigit === resultFirstDigit
      );
    }

    // ============================================================
    // DEFAULT
    // ============================================================

    default:
      return false;
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