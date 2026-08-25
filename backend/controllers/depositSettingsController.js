const DepositSettings = require("../models/DepositSettings");
const User = require("../models/authmodel");

// ===============================
// Create / Update Country Settings
// ===============================
exports.saveDepositSettings = async (req, res) => {
  try {
    const { country, countryName, currency, methods } = req.body;

    if (!country || !countryName || !currency) {
      return res.status(400).json({
        success: false,
        message: "Country, countryName and currency are required.",
      });
    }

    if (!Array.isArray(methods) || methods.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one payment method is required.",
      });
    }

    // Validate methods
    for (const method of methods) {
      if (!method.type || !method.title) {
        return res.status(400).json({
          success: false,
          message: "Each payment method must have type and title.",
        });
      }

      if (
        method.minimumDeposit &&
        method.maximumDeposit &&
        method.minimumDeposit > method.maximumDeposit
      ) {
        return res.status(400).json({
          success: false,
          message: `${method.title}: Minimum deposit cannot exceed maximum deposit.`,
        });
      }
    }

    const settings = await DepositSettings.findOneAndUpdate(
      { country: country.toUpperCase() },
      {
        country: country.toUpperCase(),
        countryName,
        currency,
        methods,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Deposit settings saved successfully.",
      data: settings,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get All Countries
// ===============================
exports.getAllDepositSettings = async (req, res) => {
  try {
    const settings = await DepositSettings.find().sort({
      countryName: 1,
    });

    return res.status(200).json({
      success: true,
      total: settings.length,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Single Country
// ===============================
exports.getDepositSettingsByCountry = async (req, res) => {
  try {
    const { country } = req.params;

    const settings = await DepositSettings.findOne({
      country: country.toUpperCase(),
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Country settings not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Delete Country
// ===============================
exports.deleteDepositSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const settings = await DepositSettings.findById(id);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Country not found.",
      });
    }

    await settings.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Country deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Logged User Deposit Methods
// ===============================
exports.getUserDepositMethods = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.country) {
      return res.status(400).json({
        success: false,
        message: "User country not set.",
      });
    }

    const settings = await DepositSettings.findOne({
      country: user.country.toUpperCase(),
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Deposit methods not available for your country.",
      });
    }

    const activeMethods = settings.methods
      .filter((item) => item.status)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return res.status(200).json({
      success: true,
      country: settings.country,
      countryName: settings.countryName,
      currency: settings.currency,
      methods: activeMethods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};