const crypto = require("crypto");
const MinesGame = require("../models/MinesGame");

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
    const position = crypto.randomInt(0, TOTAL_CELLS);
    positions.add(position);
  }

  return [...positions];
}

function getMultiplier(safeCells) {
  if (safeCells <= 0) return 1;

  return (
    MULTIPLIERS[safeCells - 1] ||
    MULTIPLIERS[MULTIPLIERS.length - 1]
  );
}

exports.startGame = async (req, res) => {
  try {
    const userId = req.user.id;

    const existing = await MinesGame.findOne({
      user: userId,
      status: "playing",
    });

    if (existing) {
      const game = await MinesGame.findById(existing._id).select(
        "+minePositions"
      );

      return res.json({
        success: true,
        game: {
          id: game._id,
          gridSize: GRID_SIZE,
          totalCells: TOTAL_CELLS,
          minesCount: game.minesCount,
          openedCells: game.openedCells,
          safeCells: game.safeCells,
          multiplier: game.multiplier,
          status: game.status,
        },
      });
    }

    const minesCount = Math.min(
      Math.max(Number(req.body.minesCount) || 5, 1),
      35
    );

    const virtualStake = Math.max(
      Number(req.body.virtualStake) || 0,
      0
    );

    const minePositions = generateMines(minesCount);

    const game = await MinesGame.create({
      user: userId,
      gridSize: GRID_SIZE,
      totalCells: TOTAL_CELLS,
      minesCount,
      minePositions,
      virtualStake,
    });

    const io = req.app.get("io");

    io.to("admin").emit("mines-game-created", {
      gameId: game._id,
      userId,
      minesCount,
      virtualStake,
      status: game.status,
    });

    return res.status(201).json({
      success: true,
      game: {
        id: game._id,
        gridSize: GRID_SIZE,
        totalCells: TOTAL_CELLS,
        minesCount,
        openedCells: [],
        safeCells: 0,
        multiplier: 1,
        status: "playing",
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to start Mines game",
    });
  }
};

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

    if (game.openedCells.includes(cell)) {
      return res.status(400).json({
        success: false,
        message: "Cell already opened",
      });
    }

    const isMine = game.minePositions.includes(cell);

    if (isMine) {
      game.status = "lost";
      game.finishedAt = new Date();

      await game.save();

      const io = req.app.get("io");

      io.to(`user-${userId}`).emit("mines-update", {
        gameId,
        cell,
        isMine: true,
        status: "lost",
        minePositions: game.minePositions,
        openedCells: game.openedCells,
      });

      io.to("admin").emit("mines-game-finished", {
        gameId,
        userId,
        status: "lost",
        cell,
      });

      return res.json({
        success: true,
        result: {
          cell,
          isMine: true,
          status: "lost",
          minePositions: game.minePositions,
          openedCells: game.openedCells,
        },
      });
    }

    game.openedCells.push(cell);
    game.safeCells = game.openedCells.length;
    game.multiplier = getMultiplier(game.safeCells);

    const safeTotal = TOTAL_CELLS - game.minesCount;

    if (game.safeCells >= safeTotal) {
      game.status = "won";
      game.virtualWin =
        Number(game.virtualStake || 0) *
        Number(game.multiplier || 1);
      game.finishedAt = new Date();
    }

    await game.save();

    const io = req.app.get("io");

    const payload = {
      gameId,
      cell,
      isMine: false,
      status: game.status,
      openedCells: game.openedCells,
      safeCells: game.safeCells,
      multiplier: game.multiplier,
      virtualWin: game.virtualWin,
    };

    io.to(`user-${userId}`).emit("mines-update", payload);

    if (game.status !== "playing") {
      io.to("admin").emit("mines-game-finished", {
        gameId,
        userId,
        status: game.status,
        virtualWin: game.virtualWin,
      });
    }

    return res.json({
      success: true,
      result: payload,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to reveal cell",
    });
  }
};

exports.cashout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.params;

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

    if (game.safeCells <= 0) {
      return res.status(400).json({
        success: false,
        message: "Open at least one safe cell",
      });
    }

    game.virtualWin =
      Number(game.virtualStake || 0) *
      Number(game.multiplier || 1);

    game.status = "cashout";
    game.finishedAt = new Date();

    await game.save();

    const io = req.app.get("io");

    io.to(`user-${userId}`).emit("mines-cashout", {
      gameId,
      status: game.status,
      virtualWin: game.virtualWin,
      multiplier: game.multiplier,
    });

    io.to("admin").emit("mines-game-finished", {
      gameId,
      userId,
      status: "cashout",
      virtualWin: game.virtualWin,
    });

    return res.json({
      success: true,
      message: "Cashout successful",
      virtualWin: game.virtualWin,
      multiplier: game.multiplier,
      status: game.status,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Cashout failed",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const games = await MinesGame.find()
      .populate("user", "username name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      games,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load history",
    });
  }
};