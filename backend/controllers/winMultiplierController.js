const WinMultiplier = require("../models/WinMultiplier");

// ======================================================
// GET WIN MULTIPLIERS
// ======================================================
const getWinMultipliers = async (req, res) => {
  try {
    let settings = await WinMultiplier.findOne();

    // Create default document if not exists
    if (!settings) {
      settings = await WinMultiplier.create({
        multipliers: {
          single: {
            name: "Single",
            value: 9,
          },
          jodi: {
            name: "Jodi",
            value: 90,
          },
          panna: {
            name: "Panna",
            value: 90,
          },
          "half-sangam": {
            name: "Half Sangam",
            value: 450,
          },
          "full-sangam": {
            name: "Full Sangam",
            value: 900,
          },
          "last-digit": {
            name: "Last Digit",
            value: 9,
          },
          "first-digit": {
            name: "First Digit",
            value: 9,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Win multipliers fetched successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Get Win Multipliers Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch win multipliers",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE WIN MULTIPLIERS
// ======================================================
const updateWinMultipliers = async (req, res) => {
  try {
    const { multipliers } = req.body;

    if (!multipliers || typeof multipliers !== "object") {
      return res.status(400).json({
        success: false,
        message: "Multipliers object is required",
      });
    }

    let settings = await WinMultiplier.findOne();

    if (!settings) {
      settings = new WinMultiplier({
        multipliers,
      });
    } else {
      settings.multipliers = multipliers;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Win multipliers updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update Win Multipliers Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update win multipliers",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE SINGLE MULTIPLIER
// ======================================================
const updateSingleMultiplier = async (req, res) => {
  try {
    const { gameType } = req.params;
    const { name, value } = req.body;

    if (!gameType) {
      return res.status(400).json({
        success: false,
        message: "Game type is required",
      });
    }

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: "Multiplier value is required",
      });
    }

    if (Number(value) < 0) {
      return res.status(400).json({
        success: false,
        message: "Multiplier value cannot be negative",
      });
    }

    let settings = await WinMultiplier.findOne();

    if (!settings) {
      settings = new WinMultiplier();
    }

    settings.multipliers.set(gameType, {
      name: name || gameType,
      value: Number(value),
    });

    await settings.save();

    res.status(200).json({
      success: true,
      message: `${gameType} multiplier updated successfully`,
      data: settings,
    });
  } catch (error) {
    console.error("Update Single Multiplier Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update multiplier",
      error: error.message,
    });
  }
};

module.exports = {
  getWinMultipliers,
  updateWinMultipliers,
  updateSingleMultiplier,
};