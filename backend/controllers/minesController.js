const crypto = require("crypto");
const MinesGame = require("../models/MinesGame");
const User = require("../models/authmodel");

const GRID_SIZE = 6;
const TOTAL_CELLS = 36;

const MULTIPLIERS = [
  1.1,
  1.25,
  1.45,
  1.7,
  2.0,
  2.4,
  2.9,
  3.5,
  4.2,
  5.0,
  6.0,
  7.5,
  9.0,
  11.0,
  14.0,
  18.0,
  23.0,
  30.0,
  40.0,
  55.0,
  75.0,
  100.0,
];

function generateMines(count) {
  const positions = new Set();

  while (positions.size < count) {
    positions.add(crypto.randomInt(0, TOTAL_CELLS));
  }

  return [...positions];
}

function getMultiplier(safeCells) {
  if (safeCells <= 0) {
    return 1;
  }

  return (
    MULTIPLIERS[safeCells - 1] ||
    MULTIPLIERS[MULTIPLIERS.length - 1]
  );
}

/* =========================================================
   START GAME
========================================================= */

exports.startGame = async (req, res) => {
  let deducted = false;
  let deductedAmount = 0;

  try {
    const userId = req.user.id;

    const minesCount = Math.min(
      Math.max(Number(req.body.minesCount) || 5, 1),
      35
    );

    const virtualStake = Number(req.body.virtualStake);

    if (
      !Number.isFinite(virtualStake) ||
      virtualStake <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid game entry amount",
      });
    }

    /*
     * -------------------------------------------------------
     * CHECK ACTIVE GAME FIRST
     * -------------------------------------------------------
     *
     * Existing game hone par balance dobara deduct nahi hoga.
     */

    const existing = await MinesGame.findOne({
      user: userId,
      status: "playing",
    }).select("+minePositions");

    if (existing) {
      const user = await User.findById(userId).select(
        "balance name email mobile"
      );

      return res.json({
        success: true,
        existingGame: true,

        balance: Number(user?.balance || 0),

        game: {
          id: existing._id,
          gridSize: existing.gridSize || GRID_SIZE,
          totalCells: existing.totalCells || TOTAL_CELLS,

          minesCount: existing.minesCount,

          openedCells: existing.openedCells || [],
          safeCells: existing.safeCells || 0,

          multiplier: Number(existing.multiplier || 1),

          virtualStake: Number(existing.virtualStake || 0),
          entryAmount: Number(existing.virtualStake || 0),

          virtualWin: Number(existing.virtualWin || 0),

          status: existing.status,

          createdAt: existing.createdAt,
        },
      });
    }

    /*
     * -------------------------------------------------------
     * VALIDATE USER
     * -------------------------------------------------------
     */

    const user = await User.findById(userId).select(
      "balance status"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
    }

    /*
     * -------------------------------------------------------
     * DEDUCT ENTRY FROM REAL BALANCE
     * -------------------------------------------------------
     *
     * Atomic condition:
     * balance >= virtualStake
     *
     * Isse negative balance nahi jayega.
     */

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        status: "active",
        balance: {
          $gte: virtualStake,
        },
      },
      {
        $inc: {
          balance: -virtualStake,
        },
      },
      {
        new: true,
      }
    ).select("balance");

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    deducted = true;
    deductedAmount = virtualStake;

    /*
     * -------------------------------------------------------
     * GENERATE MINES
     * -------------------------------------------------------
     */

    const minePositions = generateMines(minesCount);

    /*
     * -------------------------------------------------------
     * CREATE GAME
     * -------------------------------------------------------
     */

    let game;

    try {
      game = await MinesGame.create({
        user: userId,

        gridSize: GRID_SIZE,
        totalCells: TOTAL_CELLS,

        minesCount,
        minePositions,

        openedCells: [],
        safeCells: 0,

        multiplier: 1,

        virtualStake: virtualStake,
        virtualWin: 0,

        status: "playing",
      });
    } catch (createError) {
      /*
       * Game create fail ho gaya to deducted amount
       * user ko wapas de do.
       */

      await User.findByIdAndUpdate(userId, {
        $inc: {
          balance: virtualStake,
        },
      });

      deducted = false;

      throw createError;
    }

    /*
     * -------------------------------------------------------
     * SOCKET ADMIN
     * -------------------------------------------------------
     */

    const io = req.app.get("io");

    if (io) {
      io.to("admin").emit("mines-game-created", {
        gameId: game._id,
        userId,

        minesCount,

        virtualStake,
        entryAmount: virtualStake,

        balanceAfter: Number(updatedUser.balance),

        status: game.status,

        createdAt: game.createdAt,
      });
    }

    /*
     * -------------------------------------------------------
     * RESPONSE
     * -------------------------------------------------------
     */

    return res.status(201).json({
      success: true,

      balance: Number(updatedUser.balance),

      game: {
        id: game._id,

        gridSize: GRID_SIZE,
        totalCells: TOTAL_CELLS,

        minesCount,

        openedCells: [],
        safeCells: 0,

        multiplier: 1,

        virtualStake: virtualStake,
        entryAmount: virtualStake,

        virtualWin: 0,

        status: "playing",

        createdAt: game.createdAt,
      },
    });
  } catch (error) {
    console.error("Mines startGame error:", error);

    /*
     * Safety refund if something unexpected happened
     * after deduction.
     *
     * Normally create-game catch already handles refund.
     */

    if (deducted && deductedAmount > 0) {
      try {
        await User.findByIdAndUpdate(req.user.id, {
          $inc: {
            balance: deductedAmount,
          },
        });
      } catch (refundError) {
        console.error(
          "Mines balance refund error:",
          refundError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to start Mines game",
    });
  }
};

/* =========================================================
   REVEAL CELL
========================================================= */

exports.revealCell = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.params;

    const cell = Number(req.body.cell);

    if (
      !Number.isInteger(cell) ||
      cell < 0 ||
      cell >= TOTAL_CELLS
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cell",
      });
    }

    const game = await MinesGame.findOne({
      _id: gameId,
      user: userId,
      status: "playing",
    }).select("+minePositions");

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    /*
     * Prevent duplicate cell
     */

    if (game.openedCells.includes(cell)) {
      return res.status(400).json({
        success: false,
        message: "Cell already opened",
      });
    }

    /*
     * -------------------------------------------------------
     * CHECK MINE
     * -------------------------------------------------------
     */

    const isMine = game.minePositions.includes(cell);

    if (isMine) {
      game.status = "lost";
      game.finishedAt = new Date();

      /*
       * Lost game has no win.
       */

      game.virtualWin = 0;

      await game.save();

      const io = req.app.get("io");

      const payload = {
        gameId,

        cell,
        isMine: true,

        status: "lost",

        minesCount: game.minesCount,

        openedCells: game.openedCells || [],

        safeCells: game.safeCells || 0,

        multiplier: Number(game.multiplier || 1),

        virtualStake: Number(game.virtualStake || 0),
        entryAmount: Number(game.virtualStake || 0),

        virtualWin: 0,

        /*
         * Mine positions only game finish hone par
         * client ko send karna.
         */
        minePositions: game.minePositions,
      };

      if (io) {
        io.to(`user-${userId}`).emit(
          "mines-update",
          payload
        );

        io.to("admin").emit(
          "mines-game-finished",
          {
            gameId,
            userId,

            status: "lost",

            virtualStake: Number(
              game.virtualStake || 0
            ),

            virtualWin: 0,

            cell,

            finishedAt: game.finishedAt,
          }
        );
      }

      return res.json({
        success: true,
        result: payload,
      });
    }

    /*
     * -------------------------------------------------------
     * SAFE CELL
     * -------------------------------------------------------
     */

    game.openedCells.push(cell);

    game.safeCells = game.openedCells.length;

    game.multiplier = getMultiplier(
      game.safeCells
    );

    const safeTotal =
      TOTAL_CELLS - game.minesCount;

    /*
     * -------------------------------------------------------
     * AUTO WIN
     * -------------------------------------------------------
     */

    if (game.safeCells >= safeTotal) {
      game.status = "won";

      game.virtualWin =
        Number(game.virtualStake || 0) *
        Number(game.multiplier || 1);

      game.finishedAt = new Date();

      await game.save();

      /*
       * Add winning amount to real balance.
       *
       * IMPORTANT:
       * Entry was already deducted when game started.
       */

      const updatedUser =
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: {
              balance: Number(game.virtualWin || 0),
            },
          },
          {
            new: true,
          }
        ).select("balance");

      const payload = {
        gameId,

        cell,
        isMine: false,

        status: "won",

        openedCells: game.openedCells,

        safeCells: game.safeCells,

        multiplier: Number(
          game.multiplier || 1
        ),

        virtualStake: Number(
          game.virtualStake || 0
        ),

        entryAmount: Number(
          game.virtualStake || 0
        ),

        virtualWin: Number(
          game.virtualWin || 0
        ),

        balance: Number(
          updatedUser?.balance || 0
        ),

        minePositions: game.minePositions,
      };

      const io = req.app.get("io");

      if (io) {
        io.to(`user-${userId}`).emit(
          "mines-update",
          payload
        );

        io.to("admin").emit(
          "mines-game-finished",
          {
            gameId,
            userId,

            status: "won",

            virtualStake: Number(
              game.virtualStake || 0
            ),

            virtualWin: Number(
              game.virtualWin || 0
            ),

            balanceAfter: Number(
              updatedUser?.balance || 0
            ),

            finishedAt: game.finishedAt,
          }
        );
      }

      return res.json({
        success: true,

        result: payload,
      });
    }

    /*
     * -------------------------------------------------------
     * NORMAL PLAYING GAME
     * -------------------------------------------------------
     */

    await game.save();

    const payload = {
      gameId,

      cell,
      isMine: false,

      status: game.status,

      openedCells: game.openedCells,

      safeCells: game.safeCells,

      multiplier: Number(
        game.multiplier || 1
      ),

      virtualStake: Number(
        game.virtualStake || 0
      ),

      entryAmount: Number(
        game.virtualStake || 0
      ),

      virtualWin: Number(
        game.virtualWin || 0
      ),
    };

    const io = req.app.get("io");

    if (io) {
      io.to(`user-${userId}`).emit(
        "mines-update",
        payload
      );
    }

    return res.json({
      success: true,
      result: payload,
    });
  } catch (error) {
    console.error(
      "Mines revealCell error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to reveal cell",
    });
  }
};

/* =========================================================
   CASHOUT
========================================================= */

exports.cashout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.params;

    /*
     * Find active game
     */

    const game = await MinesGame.findOne({
      _id: gameId,
      user: userId,
      status: "playing",
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Active game not found",
      });
    }

    /*
     * Must open at least one safe cell
     */

    if (
      Number(game.safeCells || 0) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Open at least one safe cell",
      });
    }

    /*
     * Calculate winning
     */

    const virtualWin =
      Number(game.virtualStake || 0) *
      Number(game.multiplier || 1);

    /*
     * -------------------------------------------------------
     * UPDATE GAME FIRST
     * -------------------------------------------------------
     *
     * Use conditional update so same game cannot be
     * cashed out twice by concurrent requests.
     */

    const updatedGame =
      await MinesGame.findOneAndUpdate(
        {
          _id: gameId,
          user: userId,
          status: "playing",
          safeCells: {
            $gt: 0,
          },
        },
        {
          $set: {
            status: "cashout",

            virtualWin,

            finishedAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!updatedGame) {
      return res.status(400).json({
        success: false,
        message:
          "Game has already been completed",
      });
    }

    /*
     * -------------------------------------------------------
     * ADD WINNING TO USER BALANCE
     * -------------------------------------------------------
     */

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            balance: virtualWin,
          },
        },
        {
          new: true,
        }
      ).select("balance");

    if (!updatedUser) {
      /*
       * Very unlikely.
       *
       * Game already marked cashout, so log it loudly.
       */
      console.error(
        "CRITICAL: User not found while crediting Mines cashout",
        {
          userId,
          gameId,
          virtualWin,
        }
      );

      return res.status(500).json({
        success: false,
        message:
          "Cashout recorded but balance update failed. Contact admin.",
      });
    }

    const result = {
      gameId,

      status: "cashout",

      openedCells:
        updatedGame.openedCells || [],

      safeCells:
        updatedGame.safeCells || 0,

      multiplier:
        Number(updatedGame.multiplier || 1),

      virtualStake:
        Number(updatedGame.virtualStake || 0),

      entryAmount:
        Number(updatedGame.virtualStake || 0),

      virtualWin:
        Number(virtualWin),

      balance:
        Number(updatedUser.balance || 0),

      finishedAt:
        updatedGame.finishedAt,
    };

    /*
     * -------------------------------------------------------
     * SOCKET
     * -------------------------------------------------------
     */

    const io = req.app.get("io");

    if (io) {
      io.to(`user-${userId}`).emit(
        "mines-cashout",
        result
      );

      io.to("admin").emit(
        "mines-game-finished",
        {
          gameId,
          userId,

          status: "cashout",

          virtualStake:
            Number(
              updatedGame.virtualStake || 0
            ),

          virtualWin:
            Number(virtualWin),

          balanceAfter:
            Number(
              updatedUser.balance || 0
            ),

          finishedAt:
            updatedGame.finishedAt,
        }
      );
    }

    return res.json({
      success: true,

      message: "Cashout successful",

      virtualWin:
        Number(virtualWin),

      multiplier:
        Number(
          updatedGame.multiplier || 1
        ),

      balance:
        Number(
          updatedUser.balance || 0
        ),

      entryAmount:
        Number(
          updatedGame.virtualStake || 0
        ),

      status: "cashout",
    });
  } catch (error) {
    console.error(
      "Mines cashout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Cashout failed",
    });
  }
};

/* =========================================================
   GET HISTORY
========================================================= */

exports.getHistory = async (req, res) => {
  try {
    const games = await MinesGame.find()
      .populate(
        "user",
        "username name email mobile"
      )
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error(
      "Mines getHistory error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load history",
    });
  }
};