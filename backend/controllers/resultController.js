const Result = require("../models/Result");
const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");

// ============================================================
// GAME TYPES
// ============================================================

const TWO_DIGIT_GAME_TYPES = Object.freeze([
  "single",
  "jodi",
  "last-digit",
  "first-digit",
]);

const THREE_DIGIT_GAME_TYPES = Object.freeze([
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
// DECLARE RESULT CONTROLLER (FULL FIXED CODE)
// ============================================================

exports.declareResult = async (req, res) => {
  const session = await mongoose.startSession();

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const str = (value) => {
    if (value === undefined || value === null) {
      return "";
    }
    return String(value).trim();
  };

  // Normalize every game-type spelling to one canonical value.
  // Examples: single-Patti, single_patti, Single Patti -> single-patti
  const normalizeGameType = (value) => {
    return str(value)
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, "-")
      .replace(/-+/g, "-");
  };

  // ============================================================
  // RESULT / BID HELPERS
  // ============================================================

  // Keep all values as strings so leading zeroes are preserved.
  const digitsOnly = (value) =>
    str(value).replace(/[^0-9]/g, "");

  // SINGLE DIGIT
  // 45 -> 9
  // 989712 -> 9
  const getSingleDigit = (value) => {
    const digits = digitsOnly(value);
    if (!digits) return "";

    let sum = 0;

    for (const digit of digits) {
      sum += Number(digit);
    }

    while (sum >= 10) {
      sum = String(sum)
        .split("")
        .reduce(
          (total, digit) => total + Number(digit),
          0
        );
    }

    return String(sum);
  };

  const getFirstDigit = (value) => {
    const digits = digitsOnly(value);
    return digits ? digits.charAt(0) : "";
  };

  const getLastDigit = (value) => {
    const digits = digitsOnly(value);
    return digits
      ? digits.charAt(digits.length - 1)
      : "";
  };

  const getThreeDigit = (value) => {
    const digits = digitsOnly(value);
    if (!digits) return "";

    return digits.length >= 3
      ? digits.substring(0, 3)
      : digits.padStart(3, "0");
  };

  // SINGLE PATTI = all 3 digits different.
  const isSinglePatti = (value) => {
    const digits = getThreeDigit(value);

    return (
      digits.length === 3 &&
      new Set(digits.split("")).size === 3
    );
  };

  // DOUBLE PATTI = exactly one pair.
  // Examples: 112, 121, 211, 505.
  const isDoublePatti = (value) => {
    const digits = getThreeDigit(value);

    if (digits.length !== 3) return false;

    const counts = {};

    for (const digit of digits) {
      counts[digit] = (counts[digit] || 0) + 1;
    }

    return (
      Object.values(counts).sort().join(",") ===
      "1,2"
    );
  };

  // TRIPLE PATTI = AAA.
  const isTriplePatti = (value) => {
    const digits = getThreeDigit(value);

    return (
      digits.length === 3 &&
      digits.charAt(0) === digits.charAt(1) &&
      digits.charAt(1) === digits.charAt(2)
    );
  };

  // JODI
  // 36 -> 36
  // 123456 -> 36
  // 123-456 -> 36
  const getJodi = (value) => {
    const input = str(value);
    if (!input) return "";

    const parts = input
      .split("-")
      .map((part) => part.trim());

    // Full Sangam: last digit of each panna.
    if (
      parts.length === 2 &&
      /^\d{3}$/.test(parts[0]) &&
      /^\d{3}$/.test(parts[1])
    ) {
      return (
        parts[0].charAt(2) +
        parts[1].charAt(2)
      );
    }

    const digits = digitsOnly(input);

    // Full 6-digit result: last digit of
    // first panna + last digit of second panna.
    if (digits.length === 6) {
      return (
        digits.charAt(2) +
        digits.charAt(5)
      );
    }

    if (digits.length === 2) return digits;

    if (digits.length === 3) {
      return digits.substring(0, 2);
    }

    if (digits.length === 4) {
      return digits.substring(0, 2);
    }

    return "";
  };

  // HALF SANGAM
  // 123-6
  // 6-123
  // 123456 -> 123-6
  // 1234 -> 123-4
  const normalizeHalfSangam = (value) => {
    const input = str(value);
    if (!input) return null;

    const parts = input
      .split("-")
      .map((part) => part.trim());

    if (
      parts.length === 2 &&
      /^\d{3}$/.test(parts[0]) &&
      /^\d$/.test(parts[1])
    ) {
      return {
        panna: parts[0],
        digit: parts[1],
      };
    }

    if (
      parts.length === 2 &&
      /^\d$/.test(parts[0]) &&
      /^\d{3}$/.test(parts[1])
    ) {
      return {
        panna: parts[1],
        digit: parts[0],
      };
    }

    const digits = digitsOnly(input);

    if (digits.length === 6) {
      return {
        panna: digits.substring(0, 3),
        digit: digits.charAt(5),
      };
    }

    if (digits.length === 4) {
      return {
        panna: digits.substring(0, 3),
        digit: digits.charAt(3),
      };
    }

    return null;
  };

  const checkHalfSangamWin = (
    bidNumber,
    winningNumber
  ) => {
    const bid = normalizeHalfSangam(bidNumber);
    const winning =
      normalizeHalfSangam(winningNumber);

    if (!bid || !winning) return false;

    return (
      bid.panna === winning.panna &&
      bid.digit === winning.digit
    );
  };

  // FULL SANGAM
  const normalizeFullSangam = (value) => {
    const input = str(value);
    if (!input) return "";

    const parts = input
      .split("-")
      .map((part) => part.trim());

    if (
      parts.length === 2 &&
      /^\d{3}$/.test(parts[0]) &&
      /^\d{3}$/.test(parts[1])
    ) {
      return `${parts[0]}-${parts[1]}`;
    }

    const digits = digitsOnly(input);

    if (digits.length === 6) {
      return (
        `${digits.substring(0, 3)}-` +
        `${digits.substring(3, 6)}`
      );
    }

    return "";
  };

  // ============================================================
  // CHECK BID WIN
  // ============================================================

  const checkBidWin = (
    bid,
    formattedWinningNumbers
  ) => {
    if (!bid) return false;

    const gameType = normalizeGameType(bid.gameType);

    const bidNumber = str(bid.number);

    if (!gameType || !bidNumber) return false;

    const winningNumber =
      formattedWinningNumbers[gameType];

    if (
      winningNumber === undefined ||
      winningNumber === null ||
      str(winningNumber) === ""
    ) {
      return false;
    }

    const bidDigits = digitsOnly(bidNumber);
    const winningDigits =
      digitsOnly(winningNumber);

    if (!bidDigits || !winningDigits) {
      return false;
    }

    // SINGLE
    if (gameType === "single") {
      return (
        getSingleDigit(bidNumber) ===
        getSingleDigit(winningNumber)
      );
    }

    // FIRST DIGIT
    if (gameType === "first-digit") {
      return (
        getFirstDigit(bidNumber) ===
        getFirstDigit(winningNumber)
      );
    }

    // LAST DIGIT
    if (gameType === "last-digit") {
      return (
        getLastDigit(bidNumber) ===
        getLastDigit(winningNumber)
      );
    }

    // JODI
    if (gameType === "jodi") {
      const resultJodi = getJodi(winningNumber);
      const bidJodi = getJodi(bidNumber);

      return (
        resultJodi !== "" &&
        bidJodi !== "" &&
        bidJodi === resultJodi
      );
    }

    // SINGLE PATTI
    if (gameType === "single-patti") {
      return (
        bidDigits.length === 3 &&
        winningDigits.length >= 3 &&
        isSinglePatti(bidNumber) &&
        isSinglePatti(winningNumber) &&
        getThreeDigit(bidNumber) ===
          getThreeDigit(winningNumber)
      );
    }

    // DOUBLE PATTI
    if (gameType === "double-patti") {
      return (
        bidDigits.length === 3 &&
        winningDigits.length >= 3 &&
        isDoublePatti(bidNumber) &&
        isDoublePatti(winningNumber) &&
        getThreeDigit(bidNumber) ===
          getThreeDigit(winningNumber)
      );
    }

    // TRIPLE PATTI
    if (gameType === "triple-patti") {
      return (
        bidDigits.length === 3 &&
        winningDigits.length >= 3 &&
        isTriplePatti(bidNumber) &&
        isTriplePatti(winningNumber) &&
        getThreeDigit(bidNumber) ===
          getThreeDigit(winningNumber)
      );
    }

    // PANNA
    if (gameType === "panna") {
      return (
        bidDigits.length === 3 &&
        winningDigits.length >= 3 &&
        getThreeDigit(bidNumber) ===
          getThreeDigit(winningNumber)
      );
    }

    // OPEN
    // 1 digit = open panna ka single digit.
    // 3 digits = exact open panna.
    if (gameType === "open") {
      if (bidDigits.length === 1) {
        return (
          getSingleDigit(
            getThreeDigit(winningNumber)
          ) === bidDigits
        );
      }

      if (bidDigits.length === 3) {
        return (
          getThreeDigit(bidNumber) ===
          getThreeDigit(winningNumber)
        );
      }

      return false;
    }

    // CLOSE
    // 1 digit = close panna ka single digit.
    // 3 digits = exact close panna.
    if (gameType === "close") {
      const closePanna =
        winningDigits.length >= 6
          ? winningDigits.substring(3, 6)
          : getThreeDigit(winningNumber);

      if (bidDigits.length === 1) {
        return (
          getSingleDigit(closePanna) ===
          bidDigits
        );
      }

      if (bidDigits.length === 3) {
        return (
          getThreeDigit(bidNumber) ===
          closePanna
        );
      }

      return false;
    }

    // HALF SANGAM
    if (gameType === "half-sangam") {
      return checkHalfSangamWin(
        bidNumber,
        winningNumber
      );
    }

    // FULL SANGAM
    if (gameType === "full-sangam") {
      const bidFull =
        normalizeFullSangam(bidNumber);

      const resultFull =
        normalizeFullSangam(winningNumber);

      return (
        bidFull !== "" &&
        resultFull !== "" &&
        bidFull === resultFull
      );
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
      "single",
      "jodi",
      "open",
      "close",
      "last-digit",
      "first-digit",
    ];

    const THREE_DIGIT_GAME_TYPES = [
      "single",
      "single-patti",
      "double-patti",
      "triple-patti",
      "panna",
      "open",
      "close",
      "jodi",
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
            normalizeGameType(gameType)
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

    // Normalize result keys so single-Patti / single_patti / Single Patti
    // all resolve to the same canonical game type.
    const normalizedWinningNumbers = {};
    for (const [rawGameType, value] of Object.entries(winningNumbers)) {
      const normalizedType = normalizeGameType(rawGameType);
      if (normalizedType) {
        normalizedWinningNumbers[normalizedType] = value;
      }
    }

    for (const gameType of allowedGameTypes) {
      const number = normalizedWinningNumbers[gameType];

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

      const normalizedBidGameType = normalizeGameType(bid.gameType);

      if (
        !allowedGameTypes.includes(
          normalizedBidGameType
        )
      ) {
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

      // IMPORTANT: Always store the declared result on the bid,
      // whether the bid wins OR loses.
      const bidResultNumber =
        formattedWinningNumbers[normalizedBidGameType];

      bid.resultNumber =
        bidResultNumber !== undefined &&
        bidResultNumber !== null &&
        str(bidResultNumber) !== ""
          ? String(bidResultNumber)
          : null;

      // ----------------------------------------------------------
      // TOTAL GAME TYPE BIDS
      // ----------------------------------------------------------

      if (gameTypeStats[normalizedBidGameType]) {
        gameTypeStats[
          normalizedBidGameType
        ].total++;
      }

      // ----------------------------------------------------------
      // CHECK WIN
      // ----------------------------------------------------------

      const isWin = checkBidWin(
        {
          ...bid.toObject(),
          gameType: normalizedBidGameType,
        },
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

        // resultNumber is assigned above using normalized gameType.

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

        if (gameTypeStats[normalizedBidGameType]) {
          gameTypeStats[
            normalizedBidGameType
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

        // resultNumber is assigned above using normalized gameType.

        totalLost++;

        if (gameTypeStats[normalizedBidGameType]) {
          gameTypeStats[
            normalizedBidGameType
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