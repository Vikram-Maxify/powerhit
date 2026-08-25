const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");
const WinMultiplier = require("../models/WinMultiplier");

// ================= HELPER FUNCTIONS =================

// Generate unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BID${timestamp}${random}`;
};

// Calculate possible win amount from database WinMultiplier settings
const calculateWinAmount = async (gameType, bidAmount, session = null) => {
  try {
    const query = WinMultiplier.findOne();

    if (session) {
      query.session(session);
    }

    const settings = await query;

    if (!settings || !settings.multipliers) {
      return 0;
    }

    const multiplierData = settings.multipliers.get(gameType);

    if (!multiplierData) {
      return 0;
    }

    const multiplier = Number(multiplierData.value);
    const amount = Number(bidAmount);

    if (!Number.isFinite(multiplier) || multiplier < 0) {
      return 0;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return 0;
    }

    return amount * multiplier;
  } catch (error) {
    console.error("Calculate Win Amount Error:", error);
    return 0;
  }
};

// Validate number according to game type
const validateNumber = (gameType, number) => {
  const str = String(number).trim();

  switch (gameType) {
    case "single":
      return /^[0-9]$/.test(str);
    case "jodi":
      return /^[0-9]{2}$/.test(str);
    case "full-sangam":
      return /^[0-9]{2}$/.test(str);
    case "last-digit":
      return /^[0-9]{2}$/.test(str);
    case "first-digit":
      return /^[0-9]{2}$/.test(str);
    default:
      return false;
  }
};

// Check if a bid wins based on game type and winning number
const checkBidWin = (bid, winningNumber) => {
  const winningNumStr = String(winningNumber).trim();
  const bidNumStr = String(bid.number).trim().padStart(2, "0");

  switch (bid.gameType) {
    case "single":
      return winningNumStr === bidNumStr;
    case "jodi":
      return winningNumStr === bidNumStr;
    case "panna":
      return winningNumStr === bidNumStr;
    case "half-sangam":
      return (
        winningNumStr === bidNumStr ||
        winningNumStr.slice(-1) === bidNumStr.slice(-1)
      );
    case "full-sangam":
      return winningNumStr.slice(-2) === bidNumStr;
    case "last-digit":
      const bidLastDigit = bidNumStr.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;
    case "first-digit":
      const bidFirstDigit = bidNumStr.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;
    default:
      return false;
  }
};

// ============================================================
// ================= PLACE BID (Single) =======================
// ============================================================

exports.placeBid = async (req, res) => {
  try {
    const { marketId, gameType, number, bidAmount } = req.body;
    const userId = req.user.id;

    // Required fields validation
    if (!marketId || !gameType || !number || !bidAmount) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: marketId, gameType, number, bidAmount",
      });
    }

    // Allowed game types
    const allowedGameTypes = [
      "single",
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    if (!allowedGameTypes.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid game type. Allowed: single, jodi, panna, half-sangam, full-sangam, last-digit, first-digit",
      });
    }

    // Validate number
    if (!validateNumber(gameType, number)) {
      return res.status(400).json({
        success: false,
        message: `Invalid number format for ${gameType}. Please check the format.`,
      });
    }

    // Validate amount
    if (Number(bidAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Bid amount must be greater than 0",
      });
    }

    // Find market
    const market = await Market.findById(marketId);
    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // Check if market supports this game type
    if (market.gameTypes && !market.gameTypes.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message: `Game type '${gameType}' is not supported by this market`,
        supportedTypes: market.gameTypes,
      });
    }

    if (!market.isActive) {
      return res.status(400).json({
        success: false,
        message: "Market is currently inactive",
      });
    }

    if (market.isResultDeclared) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // Validate bid amount against market limits
    if (
      Number(bidAmount) < market.minBid ||
      Number(bidAmount) > market.maxBid
    ) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be between ₹${market.minBid} and ₹${market.maxBid}`,
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status === "suspended" || user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is suspended or blocked. Please contact support.",
      });
    }

    // Balance check
    if (user.balance < Number(bidAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        balance: user.balance,
        required: Number(bidAmount),
      });
    }

    // Calculate winning amount
    const possibleWinAmount = await calculateWinAmount(gameType, Number(bidAmount));
    if (possibleWinAmount === 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate winning amount. Invalid game type.",
      });
    }

    // Format number - pad with leading zeros for 2-digit numbers
    let formattedNumber = String(number).trim();
    if (
      ["jodi", "full-sangam", "last-digit", "first-digit"].includes(gameType)
    ) {
      formattedNumber = formattedNumber.padStart(2, "0");
    }

    // Create bid
    const bid = await Bid.create({
      userId,
      marketId,
      gameType,
      number: formattedNumber,
      bidAmount: Number(bidAmount),
      possibleWinAmount,
      transactionId: generateTransactionId(),
      status: "pending",
      bidTime: new Date(),
    });

    // Deduct balance
    user.balance -= Number(bidAmount);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: {
        bid: {
          id: bid._id,
          transactionId: bid.transactionId,
          market: {
            id: market._id,
            name: market.name,
            marketId: market.marketId,
          },
          gameType: bid.gameType,
          number: bid.number,
          bidAmount: bid.bidAmount,
          possibleWinAmount: bid.possibleWinAmount,
          status: bid.status,
          bidTime: bid.bidTime,
          createdAt: bid.createdAt,
        },
        wallet: {
          deducted: Number(bidAmount),
          remainingBalance: user.balance,
        },
      },
    });
  } catch (error) {
    console.error("Place Bid Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ============================================================
// ================= PLACE MULTIPLE BIDS ======================
// ============================================================

exports.placeMultipleBids = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bids } = req.body;
    const userId = req.user.id;

    // Validate bids array
    if (!bids || !Array.isArray(bids) || bids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bids array is required and cannot be empty",
      });
    }

    // Limit maximum bids per request
    if (bids.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 bids can be placed at once",
      });
    }

    const allowedGameTypes = [
      "single",
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    let totalBidAmount = 0;
    const bidPromises = [];
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status === "suspended" || user.status === "blocked") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message:
          "Your account is suspended or blocked. Please contact support.",
      });
    }

    // Validate all bids first
    const validatedBids = [];
    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i];
      const { marketId, gameType, number, bidAmount } = bid;

      // Validate required fields
      if (!marketId || !gameType || !number || !bidAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Bid at index ${i} has missing required fields: marketId, gameType, number, bidAmount`,
        });
      }

      // Validate game type
      if (!allowedGameTypes.includes(gameType)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid game type '${gameType}' at index ${i}. Allowed: ${allowedGameTypes.join(", ")}`,
        });
      }

      // Validate number
      if (!validateNumber(gameType, number)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid number format for ${gameType} at index ${i}`,
        });
      }

      // Validate amount
      if (Number(bidAmount) <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid bid amount at index ${i}. Amount must be greater than 0`,
        });
      }

      // Check market
      const market = await Market.findById(marketId).session(session);
      if (!market) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Market not found for bid at index ${i}`,
        });
      }

      // Check if market supports this game type
      if (market.gameTypes && !market.gameTypes.includes(gameType)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Game type '${gameType}' is not supported by market '${market.name}' at index ${i}`,
          supportedTypes: market.gameTypes,
        });
      }

      if (!market.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Market '${market.name}' is not active at index ${i}`,
        });
      }

      if (market.isResultDeclared) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Result already declared for market '${market.name}' at index ${i}`,
        });
      }

      // Validate bid amount against market limits
      if (
        Number(bidAmount) < market.minBid ||
        Number(bidAmount) > market.maxBid
      ) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Bid amount for '${market.name}' should be between ₹${market.minBid} and ₹${market.maxBid} at index ${i}`,
        });
      }

      // Calculate possible win amount
      const possibleWinAmount = await calculateWinAmount(gameType, Number(bidAmount), session);
      if (possibleWinAmount === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Unable to calculate winning amount for game type '${gameType}' at index ${i}`,
        });
      }

      totalBidAmount += Number(bidAmount);

      // Format number
      let formattedNumber = String(number).trim();
      if (
        ["jodi", "full-sangam", "last-digit", "first-digit"].includes(gameType)
      ) {
        formattedNumber = formattedNumber.padStart(2, "0");
      }

      validatedBids.push({
        ...bid,
        market,
        formattedNumber,
        possibleWinAmount,
      });
    }

    // Check total balance
    if (user.balance < totalBidAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for all bids",
        required: totalBidAmount,
        available: user.balance,
        shortfall: totalBidAmount - user.balance,
      });
    }

    // Process all bids
    const createdBids = [];
    let totalDeducted = 0;

    for (const bidData of validatedBids) {
      // Create bid
      const bid = await Bid.create(
        [
          {
            userId,
            marketId: bidData.marketId,
            gameType: bidData.gameType,
            number: bidData.formattedNumber,
            bidAmount: Number(bidData.bidAmount),
            possibleWinAmount: bidData.possibleWinAmount,
            transactionId: generateTransactionId(),
            status: "pending",
            bidTime: new Date(),
          },
        ],
        { session },
      );

      createdBids.push(bid[0]);
      totalDeducted += Number(bidData.bidAmount);
    }

    // Deduct total amount from user balance
    user.balance -= totalDeducted;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: `${createdBids.length} bids placed successfully`,
      data: {
        bids: createdBids.map((bid) => ({
          id: bid._id,
          transactionId: bid.transactionId,
          marketId: bid.marketId,
          gameType: bid.gameType,
          number: bid.number,
          bidAmount: bid.bidAmount,
          possibleWinAmount: bid.possibleWinAmount,
          status: bid.status,
          bidTime: bid.bidTime,
        })),
        wallet: {
          totalDeducted,
          remainingBalance: user.balance,
        },
        totalBids: createdBids.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Place Multiple Bids Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ============================================================
// ================= PLACE BID ON MULTIPLE NUMBERS ============
// ============================================================

exports.placeBidOnMultipleNumbers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { marketId, gameType, numbers, bidAmount } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!marketId || !gameType || !numbers || !bidAmount) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: marketId, gameType, numbers, bidAmount",
      });
    }

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Numbers array is required and cannot be empty",
      });
    }

    // Limit maximum numbers per request
    if (numbers.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 numbers can be bid at once",
      });
    }

    const allowedGameTypes = [
      "single",
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    if (!allowedGameTypes.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid game type. Allowed: single, jodi, panna, half-sangam, full-sangam, last-digit, first-digit",
      });
    }

    // Find market
    const market = await Market.findById(marketId).session(session);
    if (!market) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // Check if market supports this game type
    if (market.gameTypes && !market.gameTypes.includes(gameType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Game type '${gameType}' is not supported by this market`,
        supportedTypes: market.gameTypes,
      });
    }

    if (!market.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Market is currently inactive",
      });
    }

    if (market.isResultDeclared) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // Validate bid amount
    if (Number(bidAmount) <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Bid amount must be greater than 0",
      });
    }

    if (
      Number(bidAmount) < market.minBid ||
      Number(bidAmount) > market.maxBid
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Bid amount must be between ₹${market.minBid} and ₹${market.maxBid}`,
      });
    }

    // Validate all numbers
    const uniqueNumbers = [...new Set(numbers)];
    const totalBidAmount = uniqueNumbers.length * Number(bidAmount);

    for (const number of uniqueNumbers) {
      if (!validateNumber(gameType, number)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid number '${number}' for ${gameType}`,
        });
      }
    }

    // Find user
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status === "suspended" || user.status === "blocked") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message:
          "Your account is suspended or blocked. Please contact support.",
      });
    }

    // Check balance
    if (user.balance < totalBidAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        required: totalBidAmount,
        available: user.balance,
        shortfall: totalBidAmount - user.balance,
      });
    }

    // Calculate possible win amount
    const possibleWinAmount = await calculateWinAmount(gameType, Number(bidAmount), session);
    if (possibleWinAmount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Unable to calculate winning amount",
      });
    }

    // Create bids for each number
    const createdBids = [];
    let totalDeducted = 0;

    for (const number of uniqueNumbers) {
      // Format number
      let formattedNumber = String(number).trim();
      if (
        ["jodi", "full-sangam", "last-digit", "first-digit"].includes(gameType)
      ) {
        formattedNumber = formattedNumber.padStart(2, "0");
      }

      // Create bid
      const bid = await Bid.create(
        [
          {
            userId,
            marketId,
            gameType,
            number: formattedNumber,
            bidAmount: Number(bidAmount),
            possibleWinAmount,
            transactionId: generateTransactionId(),
            status: "pending",
            bidTime: new Date(),
          },
        ],
        { session },
      );

      createdBids.push(bid[0]);
      totalDeducted += Number(bidAmount);
    }

    // Deduct total amount from user balance
    user.balance -= totalDeducted;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: `${createdBids.length} bids placed successfully on different numbers`,
      data: {
        bids: createdBids.map((bid) => ({
          id: bid._id,
          transactionId: bid.transactionId,
          number: bid.number,
          bidAmount: bid.bidAmount,
          possibleWinAmount: bid.possibleWinAmount,
          status: bid.status,
          bidTime: bid.bidTime,
        })),
        wallet: {
          totalDeducted,
          remainingBalance: user.balance,
        },
        totalBids: createdBids.length,
        numbersPlayed: uniqueNumbers,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Place Bid on Multiple Numbers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ============================================================
// ================= GET BIDS =================================
// ============================================================

// Get user's bidding history
exports.getBiddingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      marketId,
      gameType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId };
    if (status) filter.status = status;
    if (marketId) filter.marketId = marketId;
    if (gameType) filter.gameType = gameType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const bids = await Bid.find(filter)
      .populate("marketId", "name marketId gameTypes")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    // Get summary of bids
    const summary = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Game type summary
    const gameTypeSummary = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$gameType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        bids,
        summary,
        gameTypeSummary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Bidding History Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get bid by ID (User)
exports.getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    const bid = await Bid.findOne({ _id: bidId, userId })
      .populate(
        "marketId",
        "name marketId gameTypes openTime closeTime resultTime",
      )
      .populate("userId", "name email mobile");

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    res.json({
      success: true,
      data: bid,
    });
  } catch (error) {
    console.error("Get Bid By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get all bids by user (with advanced filtering)
exports.getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
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

    const filter = { userId };

    if (marketId) filter.marketId = marketId;
    if (gameType) filter.gameType = gameType;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.bidAmount = {};
      if (minAmount) filter.bidAmount.$gte = Number(minAmount);
      if (maxAmount) filter.bidAmount.$lte = Number(maxAmount);
    }

    const bids = await Bid.find(filter)
      .populate("marketId", "name marketId gameTypes")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    // Get statistics
    const stats = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
          totalWon: {
            $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] },
          },
          totalLost: {
            $sum: { $cond: [{ $eq: ["$status", "lost"] }, 1, 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          totalWonAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        bids,
        statistics: stats[0] || {
          totalBids: 0,
          totalAmount: 0,
          totalPossibleWin: 0,
          totalWon: 0,
          totalLost: 0,
          totalPending: 0,
          totalWonAmount: 0,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get User Bids Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get today's bids summary for user
exports.getTodayBidsSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Summary by status
    const statusSummary = await Bid.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          totalBids: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Summary by game type
    const gameTypeSummary = await Bid.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: "$gameType",
          totalBids: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
        },
      },
    ]);

    // Summary by market
    const marketSummary = await Bid.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: "$marketId",
          totalBids: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
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
        $unwind: {
          path: "$market",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          marketName: "$market.name",
          marketId: "$market.marketId",
          totalBids: 1,
          totalAmount: 1,
        },
      },
    ]);

    // Total bids
    const totalBids = await Bid.countDocuments({
      userId: objectUserId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Total bid amount
    const totalAmountResult = await Bid.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$bidAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
        },
      },
    ]);

    const pending = statusSummary.find((item) => item._id === "pending") || {
      totalBids: 0,
      totalAmount: 0,
      totalPossibleWin: 0,
      totalWinAmount: 0,
    };

    const won = statusSummary.find((item) => item._id === "won") || {
      totalBids: 0,
      totalAmount: 0,
      totalPossibleWin: 0,
      totalWinAmount: 0,
    };

    const lost = statusSummary.find((item) => item._id === "lost") || {
      totalBids: 0,
      totalAmount: 0,
      totalPossibleWin: 0,
      totalWinAmount: 0,
    };

    const cancelled = statusSummary.find(
      (item) => item._id === "cancelled",
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
        totalAmount: totalAmountResult[0]?.total || 0,
        totalPossibleWin: totalAmountResult[0]?.totalPossibleWin || 0,
        pending,
        won,
        lost,
        cancelled,
        gameTypeSummary,
        marketSummary,
      },
    });
  } catch (error) {
    console.error("getTodayBidsSummary Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ============================================================
// ================= CANCEL BIDS ==============================
// ============================================================

// Cancel bid (only if not processed)
exports.cancelBid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    const bid = await Bid.findOne({
      _id: bidId,
      userId,
      status: "pending",
    }).session(session);
    if (!bid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bid not found or already processed",
      });
    }

    const user = await User.findById(userId).session(session);
    user.balance += bid.bidAmount;
    await user.save({ session });

    bid.status = "cancelled";
    bid.cancelledAt = new Date();
    await bid.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Bid cancelled successfully",
      data: {
        bidId: bid._id,
        transactionId: bid.transactionId,
        refundAmount: bid.bidAmount,
        balance: user.balance,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Cancel Bid Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Cancel multiple bids
exports.cancelMultipleBids = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidIds } = req.body;
    const userId = req.user.id;

    if (!bidIds || !Array.isArray(bidIds) || bidIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "bidIds array is required",
      });
    }

    if (bidIds.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 bids can be cancelled at once",
      });
    }

    const bids = await Bid.find({
      _id: { $in: bidIds },
      userId,
      status: "pending",
    }).session(session);

    if (bids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "No pending bids found to cancel",
      });
    }

    const user = await User.findById(userId).session(session);
    let totalRefund = 0;

    for (const bid of bids) {
      user.balance += bid.bidAmount;
      totalRefund += bid.bidAmount;
      bid.status = "cancelled";
      bid.cancelledAt = new Date();
      await bid.save({ session });
    }

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `${bids.length} bids cancelled successfully`,
      data: {
        cancelledCount: bids.length,
        totalRefund,
        balance: user.balance,
        cancelledBids: bids.map((b) => ({
          id: b._id,
          transactionId: b.transactionId,
          refundAmount: b.bidAmount,
        })),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Cancel Multiple Bids Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ============================================================
// ================= ADMIN FUNCTIONS ===========================
// ============================================================

// Get all bids (Admin)
exports.adminGetAllBids = async (req, res) => {
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
    if (status) filter.status = status;
    if (marketId) filter.marketId = marketId;
    if (userId) filter.userId = userId;
    if (gameType) filter.gameType = gameType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const bids = await Bid.find(filter)
      .populate("userId", "name email mobile balance")
      .populate("marketId", "name marketId gameTypes")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    // Summary by status
    const statusSummary = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
        },
      },
    ]);

    // Summary by game type
    const gameTypeSummary = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$gameType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Total stats
    const totalStats = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
          totalPossibleWin: { $sum: "$possibleWinAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        bids,
        summary: {
          statusSummary,
          gameTypeSummary,
          totalStats: totalStats[0] || {
            totalBids: 0,
            totalAmount: 0,
            totalWinAmount: 0,
            totalPossibleWin: 0,
          },
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin Get All Bids Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get bid stats (Admin)
exports.adminGetBidStats = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Total Bids
    const totalBids = await Bid.countDocuments();

    // Today's Bids
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBids = await Bid.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Status wise stats
    const statusStats = await Bid.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Game type wise stats
    const gameTypeStats = await Bid.aggregate([
      {
        $group: {
          _id: "$gameType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Daily stats
    const dailyStats = await Bid.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Market wise stats
    const marketStats = await Bid.aggregate([
      {
        $group: {
          _id: "$marketId",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
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
        $unwind: {
          path: "$market",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          marketName: "$market.name",
          marketId: "$market.marketId",
          count: 1,
          totalAmount: 1,
          totalWinAmount: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // User wise stats (Top bidders)
    const userStats = await Bid.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
          wonCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "won"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userName: "$user.name",
          userEmail: "$user.email",
          count: 1,
          totalAmount: 1,
          totalWinAmount: 1,
          wonCount: 1,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Hourly distribution
    const hourlyStats = await Bid.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Monthly stats
    const monthlyStats = await Bid.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.json({
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
    console.error("Admin Get Bid Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get today's bids (Admin)
exports.adminGetTodayBids = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bids = await Bid.find({
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .populate("userId", "name email mobile")
      .populate("marketId", "name marketId")
      .sort({ createdAt: -1 });

    const stats = await Bid.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        bids,
        stats,
        total: bids.length,
      },
    });
  } catch (error) {
    console.error("Admin Get Today Bids Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get bid by ID (Admin)
exports.adminGetBidById = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId)
      .populate("userId", "name email mobile balance")
      .populate("marketId", "name marketId gameTypes openTime closeTime");

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    res.json({
      success: true,
      data: bid,
    });
  } catch (error) {
    console.error("Admin Get Bid By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update bid status (Admin)
exports.adminUpdateBidStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId } = req.params;
    const { status, remarks } = req.body;

    if (!["pending", "won", "lost", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: pending, won, lost, cancelled",
      });
    }

    const bid = await Bid.findById(bidId).session(session);
    if (!bid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // If status is changing to won, update user balance
    if (status === "won" && bid.status !== "won") {
      const user = await User.findById(bid.userId).session(session);
      if (user) {
        user.balance += bid.possibleWinAmount;
        await user.save({ session });
        bid.winAmount = bid.possibleWinAmount;
        bid.wonAt = new Date();
      }
    }

    // If status was won and now changing to something else, deduct balance
    if (bid.status === "won" && status !== "won") {
      const user = await User.findById(bid.userId).session(session);
      if (user && bid.winAmount) {
        user.balance -= bid.winAmount;
        await user.save({ session });
        bid.winAmount = 0;
      }
    }

    bid.status = status;
    if (remarks) bid.remarks = remarks;
    if (status === "lost") bid.lostAt = new Date();
    await bid.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Bid status updated successfully",
      data: bid,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Admin Update Bid Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Delete bid (Admin)
exports.adminDeleteBid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).session(session);
    if (!bid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Refund if pending
    if (bid.status === "pending") {
      const user = await User.findById(bid.userId).session(session);
      if (user) {
        user.balance += bid.bidAmount;
        await user.save({ session });
      }
    }

    // If won, deduct win amount
    if (bid.status === "won" && bid.winAmount) {
      const user = await User.findById(bid.userId).session(session);
      if (user) {
        user.balance -= bid.winAmount;
        await user.save({ session });
      }
    }

    await Bid.findByIdAndDelete(bidId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Bid deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Admin Delete Bid Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


exports.declareResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { marketId } = req.params;
    const { winningNumber, gameType, resultDate } = req.body;

    // ✅ Validate required fields
    if (!winningNumber) {
      return res.status(400).json({
        success: false,
        message: "Winning number is required",
      });
    }

    if (!gameType) {
      return res.status(400).json({
        success: false,
        message: "Game type is required",
      });
    }

    // Find market
    const market = await Market.findById(marketId).session(session);
    if (!market) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // ✅ Check if market supports this game type
    if (market.gameTypes && !market.gameTypes.includes(gameType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Game type '${gameType}' is not supported by this market`,
        supportedTypes: market.gameTypes,
      });
    }

    if (market.isResultDeclared) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // ✅ Validate winning number format based on game type
    const isValidNumber = validateWinningNumber(gameType, winningNumber);
    if (!isValidNumber) {
      const formatHints = {
        single: "single digit (0-9)",
        jodi: "2-digit number (00-99)",
        panna: "3-digit number (000-999)",
        "half-sangam": "1-digit or 3-digit number",
        "full-sangam": "2-digit number (00-99)",
        "last-digit": "2-digit number (00-99)",
        "first-digit": "2-digit number (00-99)",
      };
      return res.status(400).json({
        success: false,
        message: `Invalid winning number format for ${gameType}. Expected: ${formatHints[gameType] || "valid number"}`,
      });
    }

    // ✅ Format winning number
    let formattedWinningNumber = String(winningNumber).trim();
    if (
      ["jodi", "full-sangam", "last-digit", "first-digit"].includes(gameType)
    ) {
      formattedWinningNumber = formattedWinningNumber.padStart(2, "0");
    } else if (gameType === "panna") {
      formattedWinningNumber = formattedWinningNumber.padStart(3, "0");
    }

    // ✅ Find all pending bids for this market and game type
    const pendingBids = await Bid.find({
      marketId,
      gameType: gameType, // ✅ Filter by game type
      status: "pending",
    }).session(session);

    // Process each bid
    let totalWon = 0;
    let totalLost = 0;
    let totalPayout = 0;
    const winningBidsList = [];

    for (const bid of pendingBids) {
      const isWin = checkBidWin(bid, formattedWinningNumber);

      if (isWin) {
        // Mark as won
        bid.status = "won";
        bid.winAmount = bid.possibleWinAmount;
        bid.wonAt = new Date();
        bid.resultNumber = formattedWinningNumber;

        // Add winnings to user balance
        const user = await User.findById(bid.userId).session(session);
        if (user) {
          user.balance += bid.possibleWinAmount;
          await user.save({ session });
          totalPayout += bid.possibleWinAmount;
        }
        totalWon++;
        winningBidsList.push(bid);
      } else {
        // Mark as lost
        bid.status = "lost";
        bid.lostAt = new Date();
        bid.resultNumber = formattedWinningNumber;
        totalLost++;
      }

      await bid.save({ session });
    }

    // ✅ Create Result record
    const Result = require("../models/Result"); // Make sure to import

    const resultData = {
      marketId: market._id,
      marketName: market.name,
      gameType: gameType, // ✅ Single game type
      gameTypes: market.gameTypes || [gameType], // ✅ Array of all supported types
      winningNumber: formattedWinningNumber,
      resultDate: resultDate ? new Date(resultDate) : new Date(),
      declaredBy: req.user.id,
      totalBids: pendingBids.length,
      totalWinningBids: totalWon,
      totalPayout: totalPayout,
      status: "declared",
    };

    // ✅ Extract last/first digit for easier querying
    if (gameType === "last-digit") {
      resultData.winningLastDigit = formattedWinningNumber.slice(-1);
    } else if (gameType === "first-digit") {
      resultData.winningFirstDigit = formattedWinningNumber.charAt(0);
    }

    const result = await Result.create([resultData], { session });

    // Update market
    market.winningNumber = formattedWinningNumber;
    market.isResultDeclared = true;
    market.resultDeclaredAt = new Date();
    market.declaredGameType = gameType;
    await market.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Result declared successfully",
      data: {
        market: {
          id: market._id,
          name: market.name,
          winningNumber: formattedWinningNumber,
          gameType,
        },
        result: result[0],
        summary: {
          totalBidsProcessed: pendingBids.length,
          totalWon,
          totalLost,
          totalPayout,
        },
        winningBids: winningBidsList.map((b) => ({
          id: b._id,
          userId: b.userId,
          number: b.number,
          bidAmount: b.bidAmount,
          winAmount: b.winAmount,
        })),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Declare Result Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getLowestBidNumber = async (req, res) => {
  try {
    const { marketId } = req.params;

    if (!marketId) {
      return res.status(400).json({
        success: false,
        message: "Market ID is required",
      });
    }

    const gameTypes = [
      "single",
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    const result = await Bid.aggregate([
      {
        $match: {
          marketId: new mongoose.Types.ObjectId(marketId),
          status: "pending",
          gameType: { $in: gameTypes },
        },
      },

      {
        $addFields: {
          numericNumber: {
            $convert: {
              input: "$number",
              to: "int",
              onError: null,
              onNull: null,
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
          _id: "$gameType",
          number: { $first: "$number" },
          bidAmount: { $first: "$bidAmount" },
          userId: { $first: "$userId" },
        },
      },
    ]);

    // Default structure for every game type
    const lowestBids = {};

    gameTypes.forEach((gameType) => {
      lowestBids[gameType] = {
        number: null,
        bidAmount: 0,
        userId: null,
      };
    });

    // Put aggregation result into response
    result.forEach((item) => {
      lowestBids[item._id] = {
        number: item.number,
        bidAmount: item.bidAmount,
        userId: item.userId,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Lowest bid number fetched successfully",
      marketId,
      lowestBids,
    });
  } catch (error) {
    console.error("Get Lowest Bid Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ Helper function to validate winning number
const validateWinningNumber = (gameType, number) => {
  const str = String(number).trim();

  switch (gameType) {
    case "single":
      return /^[0-9]$/.test(str);
    case "jodi":
      return /^[0-9]{2}$/.test(str);
    case "panna":
      return /^[0-9]{3}$/.test(str);
    case "half-sangam":
      return /^[0-9]{1}$/.test(str) || /^[0-9]{3}$/.test(str);
    case "full-sangam":
      return /^[0-9]{2}$/.test(str);
    case "last-digit":
      return /^[0-9]{2}$/.test(str);
    case "first-digit":
      return /^[0-9]{2}$/.test(str);
    default:
      return false;
  }
};

// Get market results
exports.getMarketResults = async (req, res) => {
  try {
    const { marketId } = req.params;

    const market = await Market.findById(marketId).select(
      "name marketId winningNumber isResultDeclared resultDeclaredAt",
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // Get winning bids
    const winningBids = await Bid.find({
      marketId,
      status: "won",
    })
      .populate("userId", "name email")
      .select("userId number bidAmount winAmount wonAt");

    // Get summary
    const summary = await Bid.aggregate([
      {
        $match: { marketId: new mongoose.Types.ObjectId(marketId) },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        market,
        winningBids,
        summary,
      },
    });
  } catch (error) {
    console.error("Get Market Results Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


exports.getBidsByMarketId = async (req, res) => {
  try {
    const { marketId } = req.params;

    if (!marketId) {
      return res.status(400).json({
        success: false,
        message: "Market ID is required",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(marketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Market ID",
      });
    }

    const bids = await Bid.find({ marketId })
      .populate("userId", "username name email mobile")
      .populate("marketId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Bids fetched successfully",
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error("Get bids by market ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
      error: error.message,
    });
  }
};
