const mongoose = require("mongoose");

const {
  getCountryModels,
  normalizeCountry,
} = require("../../config/usercontryConfig");

const TicketType = require("../../models/TicketType");
const User = require("../../models/authmodel");
const Transaction = require("../../models/Transaction");

// ==========================================
// GET COUNTRY MODELS
// ==========================================

const getModelsForRequest = (req) => {
  const country =
    req.params?.country ||
    req.body?.country ||
    req.query?.country ||
    req.country ||
    req.user?.country;

  const context = getCountryModels(country);

  return {
    country: normalizeCountry(country),
    GameCount: context.gameCount,
    GamePool: context.gamePool,
  };
};

// ==========================================
// COUNTRY CURRENCY
// ==========================================

const countryCurrencyMap = {
  india: "INR",
  nepal: "NPR",
  pakistan: "PKR",
  uae: "AED",
  australia: "AUD",
  canada: "CAD",
};

// ==========================================
// CREATE GAME POOL
// ==========================================

exports.createGamePool = async (req, res) => {
  const { country, GameCount, GamePool } =
    getModelsForRequest(req);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      ticketType,
      gameType,
      gameCount,
      games,
      autoPlay = false,
      drawCount = 1,
      totalPrice = 0,
    } = req.body;





    if (!ticketType) {
      throw new Error("Ticket Type is required.");
    }

    if (!gameCount) {
      throw new Error("Game Count is required.");
    }

    if (!Array.isArray(games) || games.length === 0) {
      throw new Error("Please select at least one game.");
    }

    if (!mongoose.Types.ObjectId.isValid(ticketType)) {
      throw new Error("Invalid Ticket Type ID.");
    }

    if (!mongoose.Types.ObjectId.isValid(gameCount)) {
      throw new Error("Invalid Game Count ID.");
    }

    // ==========================================
    // COUNTRY CURRENCY
    // NO CONVERSION
    // ==========================================

    const localCurrency =
      countryCurrencyMap[country];

    if (!localCurrency) {
      throw new Error(
        `Unsupported country: ${country}`
      );
    }

    // ==========================================
    // FIND TICKET
    // ==========================================

    const ticket = await TicketType.findById(
      ticketType
    ).session(session);

    if (!ticket) {
      throw new Error("Ticket Type not found.");
    }

    // ==========================================
    // FIND GAME COUNT
    // ==========================================

    const gameCountData =
      await GameCount.findById(gameCount)
        .session(session);

    if (!gameCountData) {
      throw new Error("Game Count not found.");
    }

    const actualGameCount =
      Number(gameCountData.totalGames || 0);

    if (actualGameCount <= 0) {
      throw new Error(
        "Invalid total games configured."
      );
    }

    // ==========================================
    // GAME COUNT MATCH
    // ==========================================

    if (actualGameCount !== games.length) {
      throw new Error(
        `Game count (${actualGameCount}) does not match selected games (${games.length}).`
      );
    }

    // ==========================================
    // CALCULATE PRICE
    // NO CURRENCY CONVERSION
    // ==========================================

    let calculatedTotalPrice =
      Number(totalPrice) || 0;

    if (calculatedTotalPrice <= 0) {
      calculatedTotalPrice =
        Number(gameCountData.price || 0) *
        actualGameCount;

      if (autoPlay) {
        calculatedTotalPrice *=
          Number(drawCount || 1);
      }
    }

    if (
      !Number.isFinite(calculatedTotalPrice) ||
      calculatedTotalPrice <= 0
    ) {
      throw new Error("Invalid game amount.");
    }

    // IMPORTANT:
    // Exact configured amount is used.
    // No USD conversion.
    // No exchange-rate calculation.
    const localAmount =
      Number(calculatedTotalPrice);

    if (
      !Number.isFinite(localAmount) ||
      localAmount <= 0
    ) {
      throw new Error("Invalid game amount.");
    }

    // ==========================================
    // USER
    // ==========================================

    if (!req.user?.id) {
      throw new Error("Authentication required.");
    }

    const user = await User.findById(
      req.user.id
    ).session(session);

    if (!user) {
      throw new Error("User not found.");
    }

    // ==========================================
    // COUNTRY CHECK
    // ==========================================

    const userCountry = normalizeCountry(
      user.country
    );

    if (
      userCountry &&
      userCountry !== country
    ) {
      throw new Error(
        `User country (${user.country}) does not match selected country (${country}).`
      );
    }

    // ==========================================
    // LOCAL AMOUNT
    // NO USD CONVERSION
    // ==========================================

    const amountToDeduct =
      localAmount;

    const currencyToUse =
      localCurrency;

    // ==========================================
    // BALANCE CHECK
    // ==========================================

    if (
      Number(user.balance || 0) <
      amountToDeduct
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,

        message:
          "Insufficient balance.",

        balance: {
          amount:
            Number(user.balance || 0),

          currency:
            currencyToUse,
        },

        required: {
          amount:
            amountToDeduct,

          currency:
            currencyToUse,
        },
      });
    }

    // ==========================================
    // GAME TYPE
    // ==========================================

    const isStandardTicket =
      !Array.isArray(ticket.gameTypes) ||
      ticket.gameTypes.length === 0;

    let selectedGameType = null;

    if (!isStandardTicket) {
      if (!gameType) {
        throw new Error(
          "Game Type is required for this ticket."
        );
      }

      if (
        !mongoose.Types.ObjectId.isValid(gameType)
      ) {
        throw new Error(
          "Invalid Game Type ID."
        );
      }

      selectedGameType =
        ticket.gameTypes.find(
          (gt) =>
            gt._id.toString() ===
            gameType.toString()
        );

      if (!selectedGameType) {
        throw new Error(
          "Game Type not found in this ticket."
        );
      }
    }

    // ==========================================
    // VALIDATE GAMES
    // ==========================================

    const formattedGames = [];
    const numberSets = new Set();

    for (
      let i = 0;
      i < games.length;
      i++
    ) {
      const game = games[i];

      if (!Array.isArray(game.numbers)) {
        throw new Error(
          `Game ${i + 1}: Numbers must be array.`
        );
      }

      if (game.numbers.length !== 7) {
        throw new Error(
          `Game ${i + 1}: Exactly 7 numbers required.`
        );
      }

      // ==========================================
      // NUMBER TYPE + RANGE
      // ==========================================

      const numbers =
        game.numbers.map(Number);

      if (
        numbers.some(
          (num) =>
            !Number.isInteger(num) ||
            num < 1 ||
            num > 69
        )
      ) {
        throw new Error(
          `Game ${i + 1}: Numbers must be integers between 1-69.`
        );
      }

      // ==========================================
      // DUPLICATE NUMBERS
      // ==========================================

      const uniqueNumbers =
        new Set(numbers);

      if (
        uniqueNumbers.size !==
        numbers.length
      ) {
        throw new Error(
          `Game ${i + 1}: Duplicate numbers not allowed.`
        );
      }

      // ==========================================
      // POWERBALL
      // ==========================================

      if (
        game.powerball === undefined ||
        game.powerball === null ||
        game.powerball === ""
      ) {
        throw new Error(
          `Game ${i + 1}: Powerball required.`
        );
      }

      const powerball =
        Number(game.powerball);

      if (
        !Number.isInteger(powerball) ||
        powerball < 1 ||
        powerball > 20
      ) {
        throw new Error(
          `Game ${i + 1}: Powerball must be an integer between 1-20.`
        );
      }

      // ==========================================
      // DUPLICATE COMBINATION
      // ==========================================

      const gameKey =
        [...numbers]
          .sort((a, b) => a - b)
          .join(",") +
        "|" +
        powerball;

      if (numberSets.has(gameKey)) {
        throw new Error(
          `Game ${i + 1}: Duplicate combination found.`
        );
      }

      numberSets.add(gameKey);

      // ==========================================
      // PUSH GAME
      // ==========================================

      formattedGames.push({
        gameNo: i + 1,
        numbers,
        powerball,
      });
    }

    // ==========================================
    // FIND EXISTING POOL
    // ==========================================

    const poolQuery = {
      ticketType,
      gameCount,
      country: country.toUpperCase(),
      status: "Open",
    };

    if (
      !isStandardTicket &&
      gameType
    ) {
      poolQuery.gameType = gameType;
    }

    let pool =
      await GamePool.findOne(
        poolQuery
      ).session(session);

    // ==========================================
    // PLAYER DATA
    // ==========================================

    const playerData = {
      user: req.user.id,

      games: formattedGames,

      // EXACT ORIGINAL AMOUNT
      bidAmount: amountToDeduct,

      // ========================================
      // NO CURRENCY CONVERSION
      // ========================================

      currencyDetails: {
        amount: amountToDeduct,
        currency: currencyToUse,

        // Backward compatibility
        convertedAmount: amountToDeduct,
        convertedCurrency: currencyToUse,

        usdAmount: null,

        localAmount: amountToDeduct,
        localCurrency: currencyToUse,

        // No conversion
        exchangeRate: 1,

        userCountry: country,
      },

      status: "Pending",
    };

    // ==========================================
    // EXISTING POOL
    // ==========================================

    if (pool) {
      const existingPlayer =
        pool.players.find(
          (player) =>
            player.user.toString() ===
            req.user.id.toString()
        );

      if (existingPlayer) {
        throw new Error(
          "You already joined this pool."
        );
      }

      pool.players.push(playerData);

      pool.totalPlayers =
        pool.players.length;

      pool.totalAmount =
        Number(pool.totalAmount || 0) +
        amountToDeduct;

      await pool.save({
        session,
      });
    }

    // ==========================================
    // CREATE NEW POOL
    // ==========================================

    else {
      const lastPool =
        await GamePool.findOne({
          country:
            country.toUpperCase(),
        })
          .sort({
            drawNo: -1,
          })
          .select("drawNo")
          .session(session);

      const nextDrawNo =
        lastPool
          ? Number(
              lastPool.drawNo || 0
            ) + 1
          : 1;

      const poolData = {
        ticketType,

        gameCount,

        country:
          country.toUpperCase(),

        drawNo:
          nextDrawNo,

        players: [
          playerData,
        ],

        totalPlayers: 1,

        totalAmount:
          amountToDeduct,

        status: "Open",
      };

      if (!isStandardTicket) {
        if (!gameType) {
          throw new Error(
            "Game Type is required to create a new pool."
          );
        }

        poolData.gameType =
          gameType;
      }

      const newPool =
        await GamePool.create(
          [poolData],
          {
            session,
          }
        );

      pool =
        newPool[0];
    }

    // ==========================================
    // DEDUCT USER BALANCE
    // EXACT AMOUNT ONLY
    // ==========================================

    const updatedUser =
      await User.findByIdAndUpdate(
        req.user.id,
        {
          $inc: {
            balance:
              -amountToDeduct,
          },
        },
        {
          new: true,
          session,
        }
      );

    if (!updatedUser) {
      throw new Error(
        "User not found during balance update."
      );
    }

    // ==========================================
    // TRANSACTION
    // ==========================================

    await Transaction.create(
      [
        {
          user:
            req.user.id,

          amount:
            amountToDeduct,

          currency:
            currencyToUse,

          usdAmount:
            null,

          type:
            "DEBIT",

          category:
            "GAME_ENTRY",

          description:
            `Game Pool Entry - ${actualGameCount} Games${
              !isStandardTicket
                ? ` - ${
                    selectedGameType?.name ||
                    ""
                  }`
                : ""
            }`,

          reference:
            pool._id,

          referenceModel:
            "GamePool",

          status:
            "completed",

          balanceAfter:
            updatedUser.balance,

          // No conversion
          exchangeRate:
            1,
        },
      ],
      {
        session,
      }
    );

    // ==========================================
    // COMMIT
    // ==========================================

    await session.commitTransaction();

    const formattedBalance =
      `${updatedUser.balance} ${currencyToUse}`;

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message:
        "Game Pool joined successfully.",

      data: {
        pool,

        country,

        currency:
          currencyToUse,

        amount:
          amountToDeduct,

        ticketType:
          isStandardTicket
            ? "standard"
            : "premium",

        gameType:
          !isStandardTicket
            ? selectedGameType?.name ||
              null
            : null,
      },

      balance: {
        amount:
          updatedUser.balance,

        currency:
          currencyToUse,

        formatted:
          formattedBalance,
      },
    });

  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Create Game Pool Error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation error",
        details:
          error.message,
      });
    }

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate entry detected.",
        details:
          error.message,
      });
    }

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });

  } finally {
    await session.endSession();
  }
};

// ==========================================
// GET MY GAME ENTRIES
// ==========================================

exports.getMyGameEntries = async (
  req,
  res
) => {
  try {
    const { GamePool } =
      getModelsForRequest(req);

    const {
      page = 1,
      limit = 10,
      status,
    } = req.query;

    const pageNumber =
      Math.max(
        Number(page),
        1
      );

    const limitNumber =
      Math.max(
        Number(limit),
        1
      );

    const query = {
      "players.user":
        req.user.id,
    };

    if (status) {
      query.status =
        status;
    }

    const entries =
      await GamePool.find(
        query
      )
        .populate(
          "ticketType",
          "name price description"
        )
        .populate(
          "gameCount",
          "totalGames price label gameType"
        )
        .sort({
          createdAt: -1,
        })
        .limit(
          limitNumber
        )
        .skip(
          (pageNumber - 1) *
            limitNumber
        );

    const formattedEntries =
      entries.map(
        (pool) => {
          const player =
            pool.players.find(
              (p) =>
                p.user.toString() ===
                req.user.id.toString()
            );

          const resultInfo = {
            status:
              player?.status ||
              "Pending",

            division:
              player?.result?.division ||
              null,

            prize:
              player?.result?.prize ||
              0,

            isWinner:
              Number(
                player?.result?.prize ||
                0
              ) > 0,

            winningNumbers:
              pool.winningNumbers ||
              null,

            resultDeclared:
              pool.resultDeclared ||
              false,
          };

          if (
            pool.resultDeclared &&
            pool.winningNumbers &&
            player?.games
          ) {
            resultInfo.matchDetails =
              player.games.map(
                (game) => {
                  const matchedNumbers =
                    game.numbers.filter(
                      (num) =>
                        pool
                          .winningNumbers
                          .numbers
                          .includes(num)
                    );

                  const powerballMatch =
                    Number(
                      game.powerball
                    ) ===
                    Number(
                      pool
                        .winningNumbers
                        .powerball
                    );

                  return {
                    gameNo:
                      game.gameNo,

                    matchedNumbers,

                    matchedCount:
                      matchedNumbers.length,

                    powerballMatch,

                    numbers:
                      game.numbers,

                    powerball:
                      game.powerball,
                  };
                }
              );
          }

          return {
            poolId:
              pool._id,

            ticketType:
              pool.ticketType,

            gameCount:
              pool.gameCount,

            gameType:
              pool.gameType ||
              null,

            drawNo:
              pool.drawNo,

            poolStatus:
              pool.status,

            playerStatus:
              player?.status ||
              null,

            games:
              player?.games ||
              [],

            bidAmount:
              player?.bidAmount ||
              0,

            currencyDetails:
              player?.currencyDetails ||
              {},

            result:
              resultInfo,

            createdAt:
              pool.createdAt,

            updatedAt:
              pool.updatedAt,

            totalPlayers:
              pool.totalPlayers,

            totalAmount:
              pool.totalAmount,

            winningNumbers:
              pool.winningNumbers,

            resultDeclared:
              pool.resultDeclared,
          };
        }
      );

    const total =
      await GamePool.countDocuments(
        query
      );

    return res.status(200).json({
      success: true,

      data:
        formattedEntries,

      pagination: {
        total,

        page:
          pageNumber,

        limit:
          limitNumber,

        pages:
          Math.ceil(
            total /
              limitNumber
          ),
      },
    });

  } catch (error) {
    console.error(
      "Get Game Entries Error:",
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

// ==========================================
// GET SINGLE GAME ENTRY
// ==========================================

exports.getSingleGameEntry = async (
  req,
  res
) => {
  try {
    const { GamePool } =
      getModelsForRequest(req);

    const pool =
      await GamePool.findOne({
        _id:
          req.params.id,

        "players.user":
          req.user.id,
      })
        .populate(
          "ticketType",
          "name price description"
        )
        .populate(
          "gameCount",
          "totalGames price label gameType"
        );

    if (!pool) {
      return res.status(404).json({
        success: false,
        message:
          "Game Entry not found or you don't have access.",
      });
    }

    const player =
      pool.players.find(
        (p) =>
          p.user.toString() ===
          req.user.id.toString()
      );

    if (!player) {
      return res.status(404).json({
        success: false,
        message:
          "Player data not found.",
      });
    }

    const resultInfo = {
      status:
        player.status ||
        "Pending",

      division:
        player.result?.division ||
        null,

      prize:
        player.result?.prize ||
        0,

      isWinner:
        Number(
          player.result?.prize ||
          0
        ) > 0,

      winningNumbers:
        pool.winningNumbers ||
        null,

      resultDeclared:
        pool.resultDeclared ||
        false,
    };

    if (
      pool.resultDeclared &&
      pool.winningNumbers &&
      player.games
    ) {
      const matchDetails =
        player.games.map(
          (game) => {
            const matchedNumbers =
              game.numbers.filter(
                (num) =>
                  pool
                    .winningNumbers
                    .numbers
                    .includes(num)
              );

            const powerballMatch =
              Number(
                game.powerball
              ) ===
              Number(
                pool
                  .winningNumbers
                  .powerball
              );

            return {
              gameNo:
                game.gameNo,

              matchedNumbers,

              matchedCount:
                matchedNumbers.length,

              powerballMatch,

              numbers:
                game.numbers,

              powerball:
                game.powerball,
            };
          }
        );

      resultInfo.matchDetails =
        matchDetails;

      resultInfo.hasWinningGame =
        matchDetails.some(
          (match) =>
            (
              match.matchedCount >= 3 &&
              match.powerballMatch
            ) ||
            match.matchedCount >= 6
        );
    }

    return res.status(200).json({
      success: true,

      data: {
        poolId:
          pool._id,

        ticketType:
          pool.ticketType,

        gameCount:
          pool.gameCount,

        gameType:
          pool.gameType ||
          null,

        drawNo:
          pool.drawNo,

        poolStatus:
          pool.status,

        playerStatus:
          player.status,

        games:
          player.games,

        bidAmount:
          player.bidAmount,

        currencyDetails:
          player.currencyDetails,

        result:
          resultInfo,

        totalPlayers:
          pool.totalPlayers,

        totalAmount:
          pool.totalAmount,

        winningNumbers:
          pool.winningNumbers,

        resultDeclared:
          pool.resultDeclared,

        createdAt:
          pool.createdAt,

        updatedAt:
          pool.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Get Single Game Entry Error:",
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

// ==========================================
// DELETE GAME ENTRY
// ==========================================

exports.deleteGameEntry = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const { GamePool } =
      getModelsForRequest(req);

    const pool =
      await GamePool.findOne({
        _id:
          req.params.id,

        "players.user":
          req.user.id,
      }).session(
        session
      );

    if (!pool) {
      throw new Error(
        "Game Entry not found."
      );
    }

    if (
      pool.status !==
      "Open"
    ) {
      throw new Error(
        `Cannot delete entry. Pool is ${pool.status}.`
      );
    }

    const playerIndex =
      pool.players.findIndex(
        (p) =>
          p.user.toString() ===
          req.user.id.toString()
      );

    if (
      playerIndex === -1
    ) {
      throw new Error(
        "Player not found in this pool."
      );
    }

    const removedPlayer =
      pool.players[
        playerIndex
      ];

    pool.players.splice(
      playerIndex,
      1
    );

    pool.totalPlayers =
      pool.players.length;

    pool.totalAmount =
      Math.max(
        0,
        Number(
          pool.totalAmount || 0
        ) -
          Number(
            removedPlayer.bidAmount ||
            0
          )
      );

    if (
      pool.players.length ===
      0
    ) {
      await pool.deleteOne({
        session,
      });
    } else {
      await pool.save({
        session,
      });
    }

    await session.commitTransaction();

    return res.status(200).json({
      success: true,

      message:
        "Game Entry deleted successfully.",
    });

  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Delete Game Entry Error:",
      error
    );

    return res.status(
      error.statusCode ||
      500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });

  } finally {
    await session.endSession();
  }
};

// ==========================================
// CANCEL GAME ENTRY WITH REFUND
// ==========================================

exports.cancelGameEntry = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      GamePool,
      country,
    } =
      getModelsForRequest(req);

    const pool =
      await GamePool.findOne({
        _id:
          req.params.id,

        "players.user":
          req.user.id,
      }).session(
        session
      );

    if (!pool) {
      throw new Error(
        "Game Entry not found."
      );
    }

    if (
      pool.status !==
      "Open"
    ) {
      throw new Error(
        `Cannot cancel entry. Pool is ${pool.status}.`
      );
    }

    const playerIndex =
      pool.players.findIndex(
        (p) =>
          p.user.toString() ===
          req.user.id.toString()
      );

    if (
      playerIndex === -1
    ) {
      throw new Error(
        "Player not found in this pool."
      );
    }

    const removedPlayer =
      pool.players[
        playerIndex
      ];

    // ==========================================
    // ORIGINAL AMOUNT ONLY
    // ==========================================

    const refundAmount =
      Number(
        removedPlayer
          ?.currencyDetails
          ?.amount
      ) ||
      Number(
        removedPlayer
          ?.currencyDetails
          ?.localAmount
      ) ||
      Number(
        removedPlayer
          ?.bidAmount
      ) ||
      0;

    // ==========================================
    // ORIGINAL CURRENCY ONLY
    // ==========================================

    const refundCurrency =
      removedPlayer
        ?.currencyDetails
        ?.currency ||
      removedPlayer
        ?.currencyDetails
        ?.localCurrency ||
      countryCurrencyMap[
        country
      ];

    if (
      !Number.isFinite(
        refundAmount
      ) ||
      refundAmount <= 0
    ) {
      throw new Error(
        "Invalid refund amount."
      );
    }

    pool.players.splice(
      playerIndex,
      1
    );

    pool.totalPlayers =
      pool.players.length;

    pool.totalAmount =
      Math.max(
        0,
        Number(
          pool.totalAmount ||
          0
        ) -
          Number(
            removedPlayer.bidAmount ||
            0
          )
      );

    if (
      pool.players.length ===
      0
    ) {
      await pool.deleteOne({
        session,
      });
    } else {
      await pool.save({
        session,
      });
    }

    // ==========================================
    // REFUND
    // NO CONVERSION
    // ==========================================

    const updatedUser =
      await User.findByIdAndUpdate(
        req.user.id,
        {
          $inc: {
            balance:
              refundAmount,
          },
        },
        {
          new: true,
          session,
        }
      );

    if (!updatedUser) {
      throw new Error(
        "User not found during refund."
      );
    }

    // ==========================================
    // REFUND TRANSACTION
    // ==========================================

    await Transaction.create(
      [
        {
          user:
            req.user.id,

          amount:
            refundAmount,

          currency:
            refundCurrency,

          usdAmount:
            null,

          type:
            "CREDIT",

          category:
            "GAME_ENTRY_REFUND",

          description:
            "Game Entry Cancellation Refund",

          reference:
            pool._id ||
            req.params.id,

          referenceModel:
            "GamePool",

          status:
            "completed",

          balanceAfter:
            updatedUser.balance,

          exchangeRate:
            1,
        },
      ],
      {
        session,
      }
    );

    await session.commitTransaction();

    const formattedBalance =
      `${updatedUser.balance} ${refundCurrency}`;

    return res.status(200).json({
      success: true,

      message:
        "Game Entry cancelled successfully. Amount refunded.",

      refund: {
        amount:
          refundAmount,

        currency:
          refundCurrency,
      },

      balance: {
        amount:
          updatedUser.balance,

        currency:
          refundCurrency,

        formatted:
          formattedBalance,
      },
    });

  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Cancel Game Entry Error:",
      error
    );

    return res.status(
      error.statusCode ||
      500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });

  } finally {
    await session.endSession();
  }
};

// ==========================================
// GET USER BALANCE
// ==========================================

exports.getUserBalance = async (
  req,
  res
) => {
  try {
    const { country } =
      getModelsForRequest(req);

    const user =
      await User.findById(
        req.user.id
      ).select(
        "balance country"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    const currency =
      countryCurrencyMap[
        country
      ];

    return res.status(200).json({
      success: true,

      balance:
        Number(
          user.balance || 0
        ),

      currency,

      country,
    });

  } catch (error) {
    console.error(
      "Get Balance Error:",
      error
    );

    return res.status(
      error.statusCode ||
      500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};