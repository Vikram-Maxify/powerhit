const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");
const WinMultiplier = require("../models/WinMultiplier");

// ============================================================
// MARKET DIGIT TYPE / GAME TYPE CONFIG
// ============================================================

// 2-digit market:
// jodi, last-digit, first-digit
const TWO_DIGIT_GAME_TYPES = [
  "jodi",
  "last-digit",
  "first-digit",
];

// 3-digit market:
// jodi, panna, half-sangam, full-sangam,
// last-digit, first-digit
const THREE_DIGIT_GAME_TYPES = [
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

const ALL_GAME_TYPES = [
  ...new Set([
    ...TWO_DIGIT_GAME_TYPES,
    ...THREE_DIGIT_GAME_TYPES,
  ]),
];

// ============================================================
// NORMALIZE DIGIT TYPE
// ============================================================

const normalizeDigitType = (market) => {
  if (!market) return null;

  const raw = String(
    market.digitType ||
      market.numberType ||
      market.digitsType ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  if (
    [
      "2",
      "2digit",
      "2-digits",
      "2digitnumber",
      "2-digit",
    ].includes(raw)
  ) {
    return "2-digit";
  }

  if (
    [
      "3",
      "3digit",
      "3-digits",
      "3digitnumber",
      "3-digit",
    ].includes(raw)
  ) {
    return "3-digit";
  }

  return null;
};

// ============================================================
// GET MARKET GAME TYPES
// ============================================================

const getMarketGameTypes = (market) => {
  const digitType = normalizeDigitType(market);

  if (digitType === "2-digit") {
    return [...TWO_DIGIT_GAME_TYPES];
  }

  if (digitType === "3-digit") {
    return [...THREE_DIGIT_GAME_TYPES];
  }

  // Backward compatibility for old market documents
  if (
    Array.isArray(market?.gameTypes) &&
    market.gameTypes.length > 0
  ) {
    return market.gameTypes.filter((type) =>
      ALL_GAME_TYPES.includes(type)
    );
  }

  return [];
};

// ============================================================
// CHECK GAME TYPE
// ============================================================

const isGameTypeAllowedForMarket = (
  market,
  gameType
) => {
  return getMarketGameTypes(market).includes(gameType);
};

// ============================================================
// FORMAT NUMBER
// ============================================================

const formatGameNumber = (
  gameType,
  number
) => {
  const value = String(number).trim();

  if (
    [
      "jodi",
      "last-digit",
      "first-digit",
    ].includes(gameType)
  ) {
    return value.padStart(2, "0");
  }

  if (gameType === "panna") {
    return value.padStart(3, "0");
  }

  // ----------------------------------------------------------
  // HALF SANGAM / FULL SANGAM
  // Keep the complete combination unchanged:
  //
  // Half Sangam:
  //   123-5
  //   5-123
  //
  // Full Sangam:
  //   123-456
  // ----------------------------------------------------------
  if (
    gameType === "half-sangam" ||
    gameType === "full-sangam"
  ) {
    return value;
  }

  return value;
};

// ============================================================
// MARKET CONFIG VALIDATION
// ============================================================

const validateMarketDigitType = (
  market
) => {
  const digitType =
    normalizeDigitType(market);

  const gameTypes =
    getMarketGameTypes(market);

  if (!digitType && gameTypes.length === 0) {
    return {
      valid: false,
      digitType: null,
      gameTypes: [],
      message:
        "Market digit type is not configured. Set market digitType to 2-digit or 3-digit.",
    };
  }

  return {
    valid: true,
    digitType: digitType || null,
    gameTypes,
  };
};

// ============================================================
// GENERATE TRANSACTION ID
// ============================================================

const generateTransactionId = () => {
  const timestamp =
    Date.now().toString(36);

  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return `BID${timestamp}${random}`;
};

// ============================================================
// CALCULATE WIN AMOUNT
// ============================================================

const calculateWinAmount = async (
  gameType,
  bidAmount,
  session = null
) => {
  try {
    const query =
      WinMultiplier.findOne();

    if (session) {
      query.session(session);
    }

    const settings = await query;

    if (
      !settings ||
      !settings.multipliers
    ) {
      return 0;
    }

    const multiplierData =
      settings.multipliers.get(
        gameType
      );

    if (!multiplierData) {
      return 0;
    }

    const multiplier =
      Number(multiplierData.value);

    const amount =
      Number(bidAmount);

    if (
      !Number.isFinite(multiplier) ||
      multiplier < 0
    ) {
      return 0;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return 0;
    }

    return amount * multiplier;
  } catch (error) {
    console.error(
      "Calculate Win Amount Error:",
      error
    );

    return 0;
  }
};

// ============================================================
// VALIDATE BID NUMBER
// ============================================================

const validateNumber = (
  gameType,
  number
) => {
  const str =
    String(number).trim();

  switch (gameType) {
    case "jodi":
      return /^[0-9]{2}$/.test(str);

    case "panna":
      return /^[0-9]{3}$/.test(str);

    case "half-sangam":
      // Panna + Digit: 123-5
      // Digit + Panna: 5-123
      return (
        /^[0-9]{3}-[0-9]$/.test(str) ||
        /^[0-9]-[0-9]{3}$/.test(str)
      );

    case "full-sangam":
      // Panna + Panna: 123-456
      return /^[0-9]{3}-[0-9]{3}$/.test(str);

    case "last-digit":
      return /^[0-9]{2}$/.test(str);

    case "first-digit":
      return /^[0-9]{2}$/.test(str);

    default:
      return false;
  }
};

// ============================================================
// CHECK BID WIN
// ============================================================

const checkBidWin = (
  bid,
  winningNumber
) => {
  const winningNumStr =
    String(winningNumber).trim();

  const bidNumStr =
    String(bid.number).trim();

  switch (bid.gameType) {
    case "jodi":
      return (
        winningNumStr === bidNumStr
      );

    case "panna":
      return (
        winningNumStr === bidNumStr
      );

    case "half-sangam": {
      const bidParts = bidNumStr.split("-");
      const resultParts =
        winningNumStr.split("-");

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

      // 123-5 => Open Panna + Close Digit
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

      // 5-123 => Open Digit + Close Panna
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

    case "full-sangam": {
      const bidParts = bidNumStr.split("-");
      const resultParts =
        winningNumStr.split("-");

      if (
        bidParts.length !== 2 ||
        resultParts.length !== 2
      ) {
        return false;
      }

      // Both sides must be 3-digit Panna.
      if (
        bidParts[0].length !== 3 ||
        bidParts[1].length !== 3 ||
        resultParts[0].length !== 3 ||
        resultParts[1].length !== 3
      ) {
        return false;
      }

      // Open Panna + Close Panna must both match.
      return (
        bidParts[0] === resultParts[0] &&
        bidParts[1] === resultParts[1]
      );
    }

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

// ============================================================
// PLACE SINGLE BID
// ============================================================

exports.placeBid = async (
  req,
  res
) => {
  try {
    const {
      marketId,
      gameType,
      number,
      bidAmount,
    } = req.body;

    const userId =
      req.user.id;

    if (
      !marketId ||
      !gameType ||
      number === undefined ||
      number === null ||
      bidAmount === undefined ||
      bidAmount === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: marketId, gameType, number, bidAmount",
      });
    }

    // single removed completely
    if (
      !ALL_GAME_TYPES.includes(
        gameType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid game type. Allowed: jodi, panna, half-sangam, full-sangam, last-digit, first-digit",
      });
    }

    if (
      !validateNumber(
        gameType,
        number
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid number format for ${gameType}`,
      });
    }

    const amount =
      Number(bidAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Bid amount must be greater than 0",
      });
    }

    const market =
      await Market.findById(
        marketId
      );

    if (!market) {
      return res.status(404).json({
        success: false,
        message:
          "Market not found",
      });
    }

    const marketConfig =
      validateMarketDigitType(
        market
      );

    if (!marketConfig.valid) {
      return res.status(400).json({
        success: false,
        message:
          marketConfig.message,
      });
    }

    if (
      !isGameTypeAllowedForMarket(
        market,
        gameType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Game type '${gameType}' is not supported by this market`,
        digitType:
          marketConfig.digitType,
        supportedTypes:
          marketConfig.gameTypes,
      });
    }

    if (!market.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Market is currently inactive",
      });
    }

    if (market.isResultDeclared) {
      return res.status(400).json({
        success: false,
        message:
          "Result already declared for this market",
      });
    }

    if (
      amount < market.minBid ||
      amount > market.maxBid
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Bid amount must be between ₹${market.minBid} and ₹${market.maxBid}`,
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (
      user.status === "suspended" ||
      user.status === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is suspended or blocked. Please contact support.",
      });
    }

    if (
      Number(user.balance) < amount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient balance",
        balance: user.balance,
        required: amount,
      });
    }

    const possibleWinAmount =
      await calculateWinAmount(
        gameType,
        amount
      );

    if (
      possibleWinAmount === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to calculate winning amount. Please check WinMultiplier settings.",
      });
    }

    const formattedNumber =
      formatGameNumber(
        gameType,
        number
      );

    const bid =
      await Bid.create({
        userId,
        marketId,
        gameType,
        number: formattedNumber,
        bidAmount: amount,
        possibleWinAmount,
        transactionId:
          generateTransactionId(),
        status: "pending",
        bidTime: new Date(),
      });

    user.balance =
      Number(user.balance) -
      amount;

    await user.save();

    return res.status(201).json({
      success: true,
      message:
        "Bid placed successfully",

      data: {
        bid: {
          id: bid._id,
          transactionId:
            bid.transactionId,

          market: {
            id: market._id,
            name: market.name,
            marketId:
              market.marketId,
            digitType:
              marketConfig.digitType,
          },

          gameType:
            bid.gameType,

          number:
            bid.number,

          bidAmount:
            bid.bidAmount,

          possibleWinAmount:
            bid.possibleWinAmount,

          status:
            bid.status,

          bidTime:
            bid.bidTime,

          createdAt:
            bid.createdAt,
        },

        wallet: {
          deducted: amount,
          remainingBalance:
            user.balance,
        },
      },
    });
  } catch (error) {
    console.error(
      "Place Bid Error:",
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
// PLACE MULTIPLE BIDS
// ============================================================

exports.placeMultipleBids = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {
    const { bids } =
      req.body;

    const userId =
      req.user.id;

    if (
      !Array.isArray(bids) ||
      bids.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Bids array is required and cannot be empty",
      });
    }

    if (bids.length > 50) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Maximum 50 bids can be placed at once",
      });
    }

    const user =
      await User.findById(
        userId
      ).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (
      user.status === "suspended" ||
      user.status === "blocked"
    ) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message:
          "Your account is suspended or blocked. Please contact support.",
      });
    }

    let totalBidAmount = 0;
    const validatedBids = [];

    for (
      let i = 0;
      i < bids.length;
      i++
    ) {
      const currentBid =
        bids[i];

      const {
        marketId,
        gameType,
        number,
        bidAmount,
      } = currentBid;

      if (
        !marketId ||
        !gameType ||
        number === undefined ||
        number === null ||
        bidAmount === undefined ||
        bidAmount === null
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Bid at index ${i} has missing required fields`,
        });
      }

      if (
        !ALL_GAME_TYPES.includes(
          gameType
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Invalid game type '${gameType}' at index ${i}`,
        });
      }

      if (
        !validateNumber(
          gameType,
          number
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Invalid number '${number}' for ${gameType} at index ${i}`,
        });
      }

      const amount =
        Number(bidAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Invalid bid amount at index ${i}`,
        });
      }

      const market =
        await Market.findById(
          marketId
        ).session(session);

      if (!market) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            `Market not found at index ${i}`,
        });
      }

      const marketConfig =
        validateMarketDigitType(
          market
        );

      if (
        !marketConfig.valid
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            marketConfig.message,
        });
      }

      if (
        !isGameTypeAllowedForMarket(
          market,
          gameType
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Game type '${gameType}' is not supported by market '${market.name}'`,
          digitType:
            marketConfig.digitType,
          supportedTypes:
            marketConfig.gameTypes,
        });
      }

      if (!market.isActive) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Market '${market.name}' is inactive`,
        });
      }

      if (
        market.isResultDeclared
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Result already declared for market '${market.name}'`,
        });
      }

      if (
        amount < market.minBid ||
        amount > market.maxBid
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Bid amount for '${market.name}' must be between ₹${market.minBid} and ₹${market.maxBid}`,
        });
      }

      const possibleWinAmount =
        await calculateWinAmount(
          gameType,
          amount,
          session
        );

      if (
        possibleWinAmount === 0
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Unable to calculate winning amount for '${gameType}'`,
        });
      }

      totalBidAmount +=
        amount;

      validatedBids.push({
        ...currentBid,
        amount,
        formattedNumber:
          formatGameNumber(
            gameType,
            number
          ),
        possibleWinAmount,
      });
    }

    if (
      Number(user.balance) <
      totalBidAmount
    ) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Insufficient balance for all bids",
        required:
          totalBidAmount,
        available:
          user.balance,
        shortfall:
          totalBidAmount -
          Number(user.balance),
      });
    }

    const createdBids = [];

    for (
      const bidData of validatedBids
    ) {
      const created =
        await Bid.create(
          [
            {
              userId,
              marketId:
                bidData.marketId,
              gameType:
                bidData.gameType,
              number:
                bidData.formattedNumber,
              bidAmount:
                bidData.amount,
              possibleWinAmount:
                bidData.possibleWinAmount,
              transactionId:
                generateTransactionId(),
              status:
                "pending",
              bidTime:
                new Date(),
            },
          ],
          { session }
        );

      createdBids.push(
        created[0]
      );
    }

    user.balance =
      Number(user.balance) -
      totalBidAmount;

    await user.save({
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message:
        `${createdBids.length} bids placed successfully`,

      data: {
        bids:
          createdBids.map(
            (bid) => ({
              id: bid._id,
              transactionId:
                bid.transactionId,
              marketId:
                bid.marketId,
              gameType:
                bid.gameType,
              number:
                bid.number,
              bidAmount:
                bid.bidAmount,
              possibleWinAmount:
                bid.possibleWinAmount,
              status:
                bid.status,
              bidTime:
                bid.bidTime,
            })
          ),

        wallet: {
          totalDeducted:
            totalBidAmount,
          remainingBalance:
            user.balance,
        },

        totalBids:
          createdBids.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(
      "Place Multiple Bids Error:",
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
// PLACE BID ON MULTIPLE NUMBERS
// ============================================================

exports.placeBidOnMultipleNumbers =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        marketId,
        gameType,
        numbers,
        bidAmount,
      } = req.body;

      const userId =
        req.user.id;

      if (
        !marketId ||
        !gameType ||
        !Array.isArray(numbers) ||
        numbers.length === 0 ||
        bidAmount === undefined ||
        bidAmount === null
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "marketId, gameType, numbers and bidAmount are required",
        });
      }

      if (numbers.length > 20) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Maximum 20 numbers can be bid at once",
        });
      }

      if (
        !ALL_GAME_TYPES.includes(
          gameType
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Invalid game type '${gameType}'`,
        });
      }

      const amount =
        Number(bidAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Bid amount must be greater than 0",
        });
      }

      const market =
        await Market.findById(
          marketId
        ).session(session);

      if (!market) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      const marketConfig =
        validateMarketDigitType(
          market
        );

      if (
        !marketConfig.valid
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            marketConfig.message,
        });
      }

      if (
        !isGameTypeAllowedForMarket(
          market,
          gameType
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Game type '${gameType}' is not supported by this market`,
          digitType:
            marketConfig.digitType,
          supportedTypes:
            marketConfig.gameTypes,
        });
      }

      if (!market.isActive) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Market is currently inactive",
        });
      }

      if (
        market.isResultDeclared
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Result already declared for this market",
        });
      }

      if (
        amount < market.minBid ||
        amount > market.maxBid
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Bid amount must be between ₹${market.minBid} and ₹${market.maxBid}`,
        });
      }

      const uniqueNumbers = [
        ...new Set(
          numbers.map((n) =>
            String(n).trim()
          )
        ),
      ];

      for (
        const number of uniqueNumbers
      ) {
        if (
          !validateNumber(
            gameType,
            number
          )
        ) {
          await session.abortTransaction();
          session.endSession();

          return res.status(400).json({
            success: false,
            message:
              `Invalid number '${number}' for ${gameType}`,
          });
        }
      }

      const totalBidAmount =
        uniqueNumbers.length *
        amount;

      const user =
        await User.findById(
          userId
        ).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      if (
        user.status === "suspended" ||
        user.status === "blocked"
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(403).json({
          success: false,
          message:
            "Your account is suspended or blocked. Please contact support.",
        });
      }

      if (
        Number(user.balance) <
        totalBidAmount
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Insufficient balance",
          required:
            totalBidAmount,
          available:
            user.balance,
        });
      }

      const possibleWinAmount =
        await calculateWinAmount(
          gameType,
          amount,
          session
        );

      if (
        possibleWinAmount === 0
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Unable to calculate winning amount",
        });
      }

      const createdBids = [];

      for (
        const number of uniqueNumbers
      ) {
        const created =
          await Bid.create(
            [
              {
                userId,
                marketId,
                gameType,
                number:
                  formatGameNumber(
                    gameType,
                    number
                  ),
                bidAmount:
                  amount,
                possibleWinAmount,
                transactionId:
                  generateTransactionId(),
                status:
                  "pending",
                bidTime:
                  new Date(),
              },
            ],
            { session }
          );

        createdBids.push(
          created[0]
        );
      }

      user.balance =
        Number(user.balance) -
        totalBidAmount;

      await user.save({
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message:
          `${createdBids.length} bids placed successfully on different numbers`,

        data: {
          bids:
            createdBids.map(
              (bid) => ({
                id: bid._id,
                transactionId:
                  bid.transactionId,
                number:
                  bid.number,
                bidAmount:
                  bid.bidAmount,
                possibleWinAmount:
                  bid.possibleWinAmount,
                status:
                  bid.status,
                bidTime:
                  bid.bidTime,
              })
            ),

          wallet: {
            totalDeducted:
              totalBidAmount,
            remainingBalance:
              user.balance,
          },

          totalBids:
            createdBids.length,

          numbersPlayed:
            createdBids.map(
              (bid) => bid.number
            ),
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(
        "Place Bid on Multiple Numbers Error:",
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
// GET BIDDING HISTORY
// ============================================================

exports.getBiddingHistory =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const {
        status,
        marketId,
        gameType,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const filter = {
        userId,
      };

      if (status)
        filter.status =
          status;

      if (marketId)
        filter.marketId =
          marketId;

      if (gameType) {
        if (
          !ALL_GAME_TYPES.includes(
            gameType
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid game type",
          });
        }

        filter.gameType =
          gameType;
      }

      if (
        startDate ||
        endDate
      ) {
        filter.createdAt = {};

        if (startDate) {
          filter.createdAt.$gte =
            new Date(
              startDate
            );
        }

        if (endDate) {
          filter.createdAt.$lte =
            new Date(
              endDate
            );
        }
      }

      const bids =
        await Bid.find(filter)
          .populate(
            "marketId",
            "name marketId digitType gameTypes openTime closeTime resultTime"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(
            parseInt(limit)
          );

      const total =
        await Bid.countDocuments(
          filter
        );

      const summary =
        await Bid.aggregate([
          {
            $match:
              filter,
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
              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },
              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      const gameTypeSummary =
        await Bid.aggregate([
          {
            $match:
              filter,
          },
          {
            $group: {
              _id: "$gameType",
              count: {
                $sum: 1,
              },
              totalAmount: {
                $sum: "$bidAmount",
              },
              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          bids,
          summary,
          gameTypeSummary,

          pagination: {
            page:
              parseInt(page),
            limit:
              parseInt(limit),
            total,
            pages:
              Math.ceil(
                total /
                  limit
              ),
          },
        },
      });
    } catch (error) {
      console.error(
        "Get Bidding History Error:",
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
// GET BID BY ID
// ============================================================

exports.getBidById =
  async (req, res) => {
    try {
      const {
        bidId,
      } = req.params;

      const userId =
        req.user.id;

      const bid =
        await Bid.findOne({
          _id: bidId,
          userId,
        })
          .populate(
            "marketId",
            "name marketId digitType gameTypes openTime closeTime resultTime"
          )
          .populate(
            "userId",
            "name email mobile"
          );

      if (!bid) {
        return res.status(404).json({
          success: false,
          message:
            "Bid not found",
        });
      }

      return res.json({
        success: true,
        data: bid,
      });
    } catch (error) {
      console.error(
        "Get Bid By ID Error:",
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
// GET USER BIDS
// ============================================================

exports.getUserBids =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const {
        marketId,
        gameType,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        page = 1,
        limit = 20,
      } = req.query;

      const filter = {
        userId,
      };

      if (marketId)
        filter.marketId =
          marketId;

      if (gameType) {
        if (
          !ALL_GAME_TYPES.includes(
            gameType
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid game type",
          });
        }

        filter.gameType =
          gameType;
      }

      if (status)
        filter.status =
          status;

      if (
        startDate ||
        endDate
      ) {
        filter.createdAt = {};

        if (startDate)
          filter.createdAt.$gte =
            new Date(
              startDate
            );

        if (endDate)
          filter.createdAt.$lte =
            new Date(
              endDate
            );
      }

      if (
        minAmount ||
        maxAmount
      ) {
        filter.bidAmount = {};

        if (minAmount)
          filter.bidAmount.$gte =
            Number(
              minAmount
            );

        if (maxAmount)
          filter.bidAmount.$lte =
            Number(
              maxAmount
            );
      }

      const bids =
        await Bid.find(filter)
          .populate(
            "marketId",
            "name marketId digitType gameTypes"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(
            parseInt(limit)
          );

      const total =
        await Bid.countDocuments(
          filter
        );

      const stats =
        await Bid.aggregate([
          {
            $match:
              filter,
          },
          {
            $group: {
              _id: null,

              totalBids: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },

              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },

              totalWon: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "won",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              totalLost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "lost",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              totalPending: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "pending",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              totalWonAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          bids,

          statistics:
            stats[0] || {
              totalBids: 0,
              totalAmount: 0,
              totalPossibleWin: 0,
              totalWon: 0,
              totalLost: 0,
              totalPending: 0,
              totalWonAmount: 0,
            },

          pagination: {
            page:
              parseInt(page),
            limit:
              parseInt(limit),
            total,
            pages:
              Math.ceil(
                total /
                  limit
              ),
          },
        },
      });
    } catch (error) {
      console.error(
        "Get User Bids Error:",
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
// TODAY BIDS SUMMARY
// ============================================================

exports.getTodayBidsSummary =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user id",
        });
      }

      const objectUserId =
        new mongoose.Types.ObjectId(
          userId
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() +
          1
      );

      const dateFilter = {
        userId:
          objectUserId,

        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      };

      const statusSummary =
        await Bid.aggregate([
          {
            $match:
              dateFilter,
          },
          {
            $group: {
              _id: "$status",

              totalBids: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },

              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      const gameTypeSummary =
        await Bid.aggregate([
          {
            $match:
              dateFilter,
          },
          {
            $group: {
              _id: "$gameType",

              totalBids: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },

              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },
            },
          },
        ]);

      const marketSummary =
        await Bid.aggregate([
          {
            $match:
              dateFilter,
          },
          {
            $group: {
              _id: "$marketId",

              totalBids: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },
            },
          },
          {
            $lookup: {
              from:
                "markets",

              localField:
                "_id",

              foreignField:
                "_id",

              as: "market",
            },
          },
          {
            $unwind: {
              path:
                "$market",
              preserveNullAndEmptyArrays:
                true,
            },
          },
          {
            $project: {
              marketName:
                "$market.name",

              marketId:
                "$market.marketId",

              digitType:
                "$market.digitType",

              totalBids: 1,
              totalAmount: 1,
            },
          },
        ]);

      const totalBids =
        await Bid.countDocuments(
          dateFilter
        );

      const totalAmountResult =
        await Bid.aggregate([
          {
            $match:
              dateFilter,
          },
          {
            $group: {
              _id: null,

              total: {
                $sum: "$bidAmount",
              },

              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },
            },
          },
        ]);

      const getStatus =
        (status) =>
          statusSummary.find(
            (item) =>
              item._id ===
              status
          ) || {
            totalBids: 0,
            totalAmount: 0,
            totalPossibleWin: 0,
            totalWinAmount: 0,
          };

      return res.status(200).json({
        success: true,

        data: {
          date: today,

          totalBids,

          totalAmount:
            totalAmountResult[0]
              ?.total || 0,

          totalPossibleWin:
            totalAmountResult[0]
              ?.totalPossibleWin ||
            0,

          pending:
            getStatus(
              "pending"
            ),

          won:
            getStatus("won"),

          lost:
            getStatus("lost"),

          cancelled:
            getStatus(
              "cancelled"
            ),

          gameTypeSummary,
          marketSummary,
        },
      });
    } catch (error) {
      console.error(
        "getTodayBidsSummary Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Internal Server Error",
      });
    }
  };

// ============================================================
// CANCEL BID
// ============================================================

exports.cancelBid =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        bidId,
      } = req.params;

      const userId =
        req.user.id;

      const bid =
        await Bid.findOne({
          _id: bidId,
          userId,
          status: "pending",
        }).session(session);

      if (!bid) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "Bid not found or already processed",
        });
      }

      const user =
        await User.findById(
          userId
        ).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      user.balance =
        Number(user.balance) +
        Number(bid.bidAmount);

      await user.save({
        session,
      });

      bid.status =
        "cancelled";

      bid.cancelledAt =
        new Date();

      await bid.save({
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message:
          "Bid cancelled successfully",

        data: {
          bidId:
            bid._id,

          transactionId:
            bid.transactionId,

          refundAmount:
            bid.bidAmount,

          balance:
            user.balance,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(
        "Cancel Bid Error:",
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
// CANCEL MULTIPLE BIDS
// ============================================================

exports.cancelMultipleBids =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        bidIds,
      } = req.body;

      const userId =
        req.user.id;

      if (
        !Array.isArray(bidIds) ||
        bidIds.length === 0
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "bidIds array is required",
        });
      }

      if (
        bidIds.length > 20
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Maximum 20 bids can be cancelled at once",
        });
      }

      const bids =
        await Bid.find({
          _id: {
            $in: bidIds,
          },

          userId,

          status:
            "pending",
        }).session(session);

      if (
        bids.length === 0
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "No pending bids found to cancel",
        });
      }

      const user =
        await User.findById(
          userId
        ).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      let totalRefund = 0;

      for (
        const bid of bids
      ) {
        user.balance +=
          Number(
            bid.bidAmount
          );

        totalRefund +=
          Number(
            bid.bidAmount
          );

        bid.status =
          "cancelled";

        bid.cancelledAt =
          new Date();

        await bid.save({
          session,
        });
      }

      await user.save({
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message:
          `${bids.length} bids cancelled successfully`,

        data: {
          cancelledCount:
            bids.length,

          totalRefund,

          balance:
            user.balance,

          cancelledBids:
            bids.map(
              (bid) => ({
                id:
                  bid._id,

                transactionId:
                  bid.transactionId,

                refundAmount:
                  bid.bidAmount,
              })
            ),
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(
        "Cancel Multiple Bids Error:",
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
// ADMIN GET ALL BIDS
// ============================================================

exports.adminGetAllBids =
  async (req, res) => {
    try {
      const {
        status,
        marketId,
        userId,
        gameType,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const filter = {};

      if (status)
        filter.status =
          status;

      if (marketId)
        filter.marketId =
          marketId;

      if (userId)
        filter.userId =
          userId;

      if (gameType) {
        if (
          !ALL_GAME_TYPES.includes(
            gameType
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid game type",
          });
        }

        filter.gameType =
          gameType;
      }

      if (
        startDate ||
        endDate
      ) {
        filter.createdAt = {};

        if (startDate)
          filter.createdAt.$gte =
            new Date(
              startDate
            );

        if (endDate)
          filter.createdAt.$lte =
            new Date(
              endDate
            );
      }

      const bids =
        await Bid.find(filter)
          .populate(
            "userId",
            "name email mobile balance"
          )
          .populate(
            "marketId",
            "name marketId digitType gameTypes"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(
            parseInt(limit)
          );

      const total =
        await Bid.countDocuments(
          filter
        );

      const statusSummary =
        await Bid.aggregate([
          {
            $match:
              filter,
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
                $sum:
                  "$winAmount",
              },

              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },
            },
          },
        ]);

      const gameTypeSummary =
        await Bid.aggregate([
          {
            $match:
              filter,
          },
          {
            $group: {
              _id: "$gameType",

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      const totalStats =
        await Bid.aggregate([
          {
            $match:
              filter,
          },
          {
            $group: {
              _id: null,

              totalBids: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },

              totalPossibleWin: {
                $sum:
                  "$possibleWinAmount",
              },
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          bids,

          summary: {
            statusSummary,
            gameTypeSummary,

            totalStats:
              totalStats[0] || {
                totalBids: 0,
                totalAmount: 0,
                totalWinAmount: 0,
                totalPossibleWin: 0,
              },
          },

          pagination: {
            page:
              parseInt(page),

            limit:
              parseInt(limit),

            total,

            pages:
              Math.ceil(
                total /
                  limit
              ),
          },
        },
      });
    } catch (error) {
      console.error(
        "Admin Get All Bids Error:",
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
// ADMIN BID STATS
// ============================================================

exports.adminGetBidStats =
  async (req, res) => {
    try {
      const {
        period = "30d",
      } = req.query;

      const now =
        new Date();

      let startDate =
        new Date();

      switch (period) {
        case "7d":
          startDate.setDate(
            now.getDate() -
              7
          );
          break;

        case "30d":
          startDate.setDate(
            now.getDate() -
              30
          );
          break;

        case "90d":
          startDate.setDate(
            now.getDate() -
              90
          );
          break;

        case "1y":
          startDate.setFullYear(
            now.getFullYear() -
              1
          );
          break;

        default:
          startDate.setDate(
            now.getDate() -
              30
          );
      }

      const totalBids =
        await Bid.countDocuments();

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() +
          1
      );

      const todayBids =
        await Bid.countDocuments(
          {
            createdAt: {
              $gte: today,
              $lt: tomorrow,
            },
          }
        );

      const statusStats =
        await Bid.aggregate([
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
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      const gameTypeStats =
        await Bid.aggregate([
          {
            $group: {
              _id: "$gameType",

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum: "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      const dailyStats =
        await Bid.aggregate([
          {
            $match: {
              createdAt: {
                $gte:
                  startDate,
              },
            },
          },
          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$createdAt",
                },

                month: {
                  $month:
                    "$createdAt",
                },

                day: {
                  $dayOfMonth:
                    "$createdAt",
                },
              },

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
              "_id.day": 1,
            },
          },
        ]);

      const marketStats =
        await Bid.aggregate([
          {
            $group: {
              _id:
                "$marketId",

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },

          {
            $lookup: {
              from:
                "markets",

              localField:
                "_id",

              foreignField:
                "_id",

              as: "market",
            },
          },

          {
            $unwind: {
              path:
                "$market",
              preserveNullAndEmptyArrays:
                true,
            },
          },

          {
            $project: {
              marketName:
                "$market.name",

              marketId:
                "$market.marketId",

              digitType:
                "$market.digitType",

              count: 1,
              totalAmount: 1,
              totalWinAmount: 1,
            },
          },

          {
            $sort: {
              count: -1,
            },
          },

          {
            $limit: 10,
          },
        ]);

      const userStats =
        await Bid.aggregate([
          {
            $group: {
              _id:
                "$userId",

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },

              wonCount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "won",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },

          {
            $lookup: {
              from:
                "users",

              localField:
                "_id",

              foreignField:
                "_id",

              as: "user",
            },
          },

          {
            $unwind: {
              path:
                "$user",
              preserveNullAndEmptyArrays:
                true,
            },
          },

          {
            $project: {
              userName:
                "$user.name",

              userEmail:
                "$user.email",

              count: 1,
              totalAmount: 1,
              totalWinAmount: 1,
              wonCount: 1,
            },
          },

          {
            $sort: {
              totalAmount: -1,
            },
          },

          {
            $limit: 10,
          },
        ]);

      const hourlyStats =
        await Bid.aggregate([
          {
            $match: {
              createdAt: {
                $gte:
                  startDate,
              },
            },
          },

          {
            $group: {
              _id: {
                $hour:
                  "$createdAt",
              },

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);

      const monthlyStats =
        await Bid.aggregate([
          {
            $match: {
              createdAt: {
                $gte:
                  startDate,
              },
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$createdAt",
                },

                month: {
                  $month:
                    "$createdAt",
                },
              },

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },

          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          totalBids,
          todayBids,
          statusStats,
          gameTypeStats,
          dailyStats,
          marketStats,
          userStats,
          hourlyStats,
          monthlyStats,
          period,
          startDate,
        },
      });
    } catch (error) {
      console.error(
        "Admin Get Bid Stats Error:",
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
// ADMIN TODAY BIDS
// ============================================================

exports.adminGetTodayBids =
  async (req, res) => {
    try {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() +
          1
      );

      const bids =
        await Bid.find({
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        })
          .populate(
            "userId",
            "name email mobile"
          )
          .populate(
            "marketId",
            "name marketId digitType"
          )
          .sort({
            createdAt: -1,
          });

      const stats =
        await Bid.aggregate([
          {
            $match: {
              createdAt: {
                $gte: today,
                $lt: tomorrow,
              },
            },
          },

          {
            $group: {
              _id: "$status",

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          bids,
          stats,
          total:
            bids.length,
        },
      });
    } catch (error) {
      console.error(
        "Admin Get Today Bids Error:",
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
// ADMIN GET BID BY ID
// ============================================================

exports.adminGetBidById =
  async (req, res) => {
    try {
      const {
        bidId,
      } = req.params;

      const bid =
        await Bid.findById(
          bidId
        )
          .populate(
            "userId",
            "name email mobile balance"
          )
          .populate(
            "marketId",
            "name marketId digitType gameTypes openTime closeTime"
          );

      if (!bid) {
        return res.status(404).json({
          success: false,
          message:
            "Bid not found",
        });
      }

      return res.json({
        success: true,
        data: bid,
      });
    } catch (error) {
      console.error(
        "Admin Get Bid By ID Error:",
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
// ADMIN UPDATE BID STATUS
// ============================================================

exports.adminUpdateBidStatus =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        bidId,
      } = req.params;

      const {
        status,
        remarks,
      } = req.body;

      if (
        ![
          "pending",
          "won",
          "lost",
          "cancelled",
        ].includes(status)
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Allowed: pending, won, lost, cancelled",
        });
      }

      const bid =
        await Bid.findById(
          bidId
        ).session(session);

      if (!bid) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "Bid not found",
        });
      }

      if (
        status === "won" &&
        bid.status !== "won"
      ) {
        const user =
          await User.findById(
            bid.userId
          ).session(session);

        if (user) {
          user.balance +=
            Number(
              bid.possibleWinAmount
            );

          await user.save({
            session,
          });

          bid.winAmount =
            bid.possibleWinAmount;

          bid.wonAt =
            new Date();
        }
      }

      if (
        bid.status === "won" &&
        status !== "won"
      ) {
        const user =
          await User.findById(
            bid.userId
          ).session(session);

        if (
          user &&
          bid.winAmount
        ) {
          user.balance -=
            Number(
              bid.winAmount
            );

          await user.save({
            session,
          });

          bid.winAmount = 0;
        }
      }

      bid.status =
        status;

      if (remarks)
        bid.remarks =
          remarks;

      if (
        status === "lost"
      ) {
        bid.lostAt =
          new Date();
      }

      await bid.save({
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message:
          "Bid status updated successfully",
        data: bid,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(
        "Admin Update Bid Status Error:",
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
// ADMIN DELETE BID
// ============================================================

exports.adminDeleteBid =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        bidId,
      } = req.params;

      const bid =
        await Bid.findById(
          bidId
        ).session(session);

      if (!bid) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "Bid not found",
        });
      }

      if (
        bid.status ===
        "pending"
      ) {
        const user =
          await User.findById(
            bid.userId
          ).session(session);

        if (user) {
          user.balance +=
            Number(
              bid.bidAmount
            );

          await user.save({
            session,
          });
        }
      }

      if (
        bid.status ===
          "won" &&
        bid.winAmount
      ) {
        const user =
          await User.findById(
            bid.userId
          ).session(session);

        if (user) {
          user.balance -=
            Number(
              bid.winAmount
            );

          await user.save({
            session,
          });
        }
      }

      await Bid.findByIdAndDelete(
        bidId
      ).session(session);

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message:
          "Bid deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(
        "Admin Delete Bid Error:",
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
// VALIDATE WINNING NUMBER
// ============================================================

const validateWinningNumber = (
  gameType,
  number
) => {
  const str =
    String(number).trim();

  switch (gameType) {
    case "jodi":
      return /^[0-9]{2}$/.test(str);

    case "panna":
      return /^[0-9]{3}$/.test(str);

    case "half-sangam":
      // Result must be Panna + Digit OR Digit + Panna.
      return (
        /^[0-9]{3}-[0-9]$/.test(str) ||
        /^[0-9]-[0-9]{3}$/.test(str)
      );

    case "full-sangam":
      // Result must contain two 3-digit Pannas.
      return /^[0-9]{3}-[0-9]{3}$/.test(str);

    case "last-digit":
      return /^[0-9]{2}$/.test(str);

    case "first-digit":
      return /^[0-9]{2}$/.test(str);

    default:
      return false;
  }
};

// ============================================================
// DECLARE RESULT
// ============================================================

exports.declareResult =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        marketId,
      } = req.params;

      const {
        winningNumber,
        gameType,
        resultDate,
      } = req.body;

      if (
        winningNumber ===
          undefined ||
        winningNumber ===
          null ||
        String(
          winningNumber
        ).trim() === ""
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Winning number is required",
        });
      }

      if (!gameType) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Game type is required",
        });
      }

      if (
        !ALL_GAME_TYPES.includes(
          gameType
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Invalid game type",
        });
      }

      const market =
        await Market.findById(
          marketId
        ).session(session);

      if (!market) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      const marketConfig =
        validateMarketDigitType(
          market
        );

      if (
        !marketConfig.valid
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            marketConfig.message,
        });
      }

      if (
        !isGameTypeAllowedForMarket(
          market,
          gameType
        )
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Game type '${gameType}' is not supported by this market`,
          digitType:
            marketConfig.digitType,
          supportedTypes:
            marketConfig.gameTypes,
        });
      }

      if (
        market.isResultDeclared
      ) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            "Result already declared for this market",
        });
      }

      if (
        !validateWinningNumber(
          gameType,
          winningNumber
        )
      ) {
        const formatHints =
          {
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

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message:
            `Invalid winning number format for ${gameType}. Expected: ${
              formatHints[
                gameType
              ] ||
              "valid number"
            }`,
        });
      }

      const formattedWinningNumber =
        formatGameNumber(
          gameType,
          winningNumber
        );

      const pendingBids =
        await Bid.find({
          marketId,
          gameType,
          status: "pending",
        }).session(session);

      let totalWon = 0;
      let totalLost = 0;
      let totalPayout = 0;

      const winningBidsList = [];

      for (
        const bid of pendingBids
      ) {
        const isWin =
          checkBidWin(
            bid,
            formattedWinningNumber
          );

        if (isWin) {
          bid.status =
            "won";

          bid.winAmount =
            bid.possibleWinAmount;

          bid.wonAt =
            new Date();

          bid.resultNumber =
            formattedWinningNumber;

          const user =
            await User.findById(
              bid.userId
            ).session(session);

          if (user) {
            user.balance +=
              Number(
                bid.possibleWinAmount
              );

            await user.save({
              session,
            });

            totalPayout +=
              Number(
                bid.possibleWinAmount
              );
          }

          totalWon++;

          winningBidsList.push(
            bid
          );
        } else {
          bid.status =
            "lost";

          bid.lostAt =
            new Date();

          bid.resultNumber =
            formattedWinningNumber;

          totalLost++;
        }

        await bid.save({
          session,
        });
      }

      const Result =
        require("../models/Result");

      const resultData = {
        marketId:
          market._id,

        marketName:
          market.name,

        gameType,

        gameTypes:
          marketConfig.gameTypes,

        winningNumber:
          formattedWinningNumber,

        resultDate:
          resultDate
            ? new Date(
                resultDate
              )
            : new Date(),

        declaredBy:
          req.user.id,

        totalBids:
          pendingBids.length,

        totalWinningBids:
          totalWon,

        totalPayout,

        status:
          "declared",
      };

      if (
        gameType ===
        "last-digit"
      ) {
        resultData.winningLastDigit =
          formattedWinningNumber.slice(
            -1
          );
      }

      if (
        gameType ===
        "first-digit"
      ) {
        resultData.winningFirstDigit =
          formattedWinningNumber.charAt(
            0
          );
      }

      const result =
        await Result.create(
          [resultData],
          { session }
        );

      market.winningNumber =
        formattedWinningNumber;

      market.isResultDeclared =
        true;

      market.resultDeclaredAt =
        new Date();

      market.declaredGameType =
        gameType;

      await market.save({
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message:
          "Result declared successfully",

        data: {
          market: {
            id: market._id,
            name: market.name,
            digitType:
              marketConfig.digitType,
            winningNumber:
              formattedWinningNumber,
            gameType,
          },

          result:
            result[0],

          summary: {
            totalBidsProcessed:
              pendingBids.length,

            totalWon,

            totalLost,

            totalPayout,
          },

          winningBids:
            winningBidsList.map(
              (bid) => ({
                id:
                  bid._id,

                userId:
                  bid.userId,

                number:
                  bid.number,

                bidAmount:
                  bid.bidAmount,

                winAmount:
                  bid.winAmount,
              })
            ),
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

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
// GET LOWEST BID NUMBER
// ============================================================

exports.getLowestBidNumber =
  async (req, res) => {
    try {
      const {
        marketId,
      } = req.params;

      if (!marketId) {
        return res.status(400).json({
          success: false,
          message:
            "Market ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          marketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Market ID",
        });
      }

      const market =
        await Market.findById(
          marketId
        ).select(
          "digitType numberType gameTypes"
        );

      if (!market) {
        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      const gameTypes =
        getMarketGameTypes(
          market
        );

      const result =
        await Bid.aggregate([
          {
            $match: {
              marketId:
                new mongoose.Types.ObjectId(
                  marketId
                ),

              status:
                "pending",

              gameType: {
                $in:
                  gameTypes,
              },
            },
          },

          {
            $addFields: {
              numericNumber: {
                $convert: {
                  input:
                    "$number",

                  to: "int",

                  onError:
                    null,

                  onNull:
                    null,
                },
              },
            },
          },

          {
            $sort: {
              gameType: 1,
              numericNumber: 1,
            },
          },

          {
            $group: {
              _id:
                "$gameType",

              number: {
                $first:
                  "$number",
              },

              bidAmount: {
                $first:
                  "$bidAmount",
              },

              userId: {
                $first:
                  "$userId",
              },
            },
          },
        ]);

      const lowestBids = {};

      gameTypes.forEach(
        (type) => {
          lowestBids[type] = {
            number: null,
            bidAmount: 0,
            userId: null,
          };
        }
      );

      result.forEach(
        (item) => {
          lowestBids[
            item._id
          ] = {
            number:
              item.number,

            bidAmount:
              item.bidAmount,

            userId:
              item.userId,
          };
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Lowest bid number fetched successfully",

        marketId,

        digitType:
          normalizeDigitType(
            market
          ),

        gameTypes,

        lowestBids,
      });
    } catch (error) {
      console.error(
        "Get Lowest Bid Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error",

        error:
          error.message,
      });
    }
  };

// ============================================================
// GET MARKET RESULTS
// ============================================================

exports.getMarketResults =
  async (req, res) => {
    try {
      const {
        marketId,
      } = req.params;

      const market =
        await Market.findById(
          marketId
        ).select(
          "name marketId digitType gameTypes winningNumber isResultDeclared resultDeclaredAt declaredGameType"
        );

      if (!market) {
        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      const winningBids =
        await Bid.find({
          marketId,
          status: "won",
        })
          .populate(
            "userId",
            "name email"
          )
          .select(
            "userId gameType number bidAmount winAmount wonAt"
          );

      const summary =
        await Bid.aggregate([
          {
            $match: {
              marketId:
                new mongoose.Types.ObjectId(
                  marketId
                ),
            },
          },

          {
            $group: {
              _id:
                "$status",

              count: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$bidAmount",
              },

              totalWinAmount: {
                $sum:
                  "$winAmount",
              },
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          market,
          winningBids,
          summary,
        },
      });
    } catch (error) {
      console.error(
        "Get Market Results Error:",
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
// GET BIDS BY MARKET ID
// ============================================================

exports.getBidsByMarketId =
  async (req, res) => {
    try {
      const {
        marketId,
      } = req.params;

      if (!marketId) {
        return res.status(400).json({
          success: false,
          message:
            "Market ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          marketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Market ID",
        });
      }

      const bids =
        await Bid.find({
          marketId,
        })
          .populate(
            "userId",
            "username name email mobile"
          )
          .populate(
            "marketId",
            "name marketId digitType gameTypes"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Bids fetched successfully",

        count:
          bids.length,

        data: bids,
      });
    } catch (error) {
      console.error(
        "Get bids by market ID error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch bids",

        error:
          error.message,
      });
    }
  };

// ============================================================
// GET ALLOWED GAME TYPES FOR MARKET
// ============================================================

exports.getAllowedGameTypesForMarket =
  async (req, res) => {
    try {
      const {
        marketId,
      } = req.params;

      if (
        !marketId ||
        !mongoose.Types.ObjectId.isValid(
          marketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid Market ID is required",
        });
      }

      const market =
        await Market.findById(
          marketId
        ).select(
          "name marketId digitType numberType gameTypes isActive isResultDeclared minBid maxBid"
        );

      if (!market) {
        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      const config =
        validateMarketDigitType(
          market
        );

      return res.status(200).json({
        success: true,

        data: {
          market,

          digitType:
            config.digitType,

          gameTypes:
            config.gameTypes,
        },
      });
    } catch (error) {
      console.error(
        "Get Allowed Game Types Error:",
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