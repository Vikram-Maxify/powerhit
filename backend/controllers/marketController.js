const Market = require("../models/Market");
const uploadToImgBB = require("../utils/uploadToImgBB");

// ==========================================================
// CREATE MARKET
// ==========================================================

exports.createMarket = async (req, res) => {
  try {
    const {
      name,
      marketId,
      openTime,
      closeTime,
      resultTime,
      minBid,
      maxBid,
      description,
    } = req.body;

    // ======================================================
    // VALIDATION
    // ======================================================

    if (!name || !marketId || !openTime || !closeTime || !resultTime) {
      return res.status(400).json({
        success: false,
        message:
          "Name, market ID, open time, close time and result time are required",
      });
    }

    // ======================================================
    // CHECK DUPLICATE
    // ======================================================

    const existingMarket = await Market.findOne({
      $or: [
        {
          name: name.trim(),
        },
        {
          marketId: marketId.trim(),
        },
      ],
    });

    if (existingMarket) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }

    // ======================================================
    // IMAGE UPLOAD
    // ======================================================

    let imageUrl = "";

    if (req.file) {
      const uploadedImage = await uploadToImgBB(req.file);

      console.log("ImgBB response:", uploadedImage);
      console.log("ImgBB response type:", typeof uploadedImage);

      // uploadToImgBB should return string
      if (typeof uploadedImage === "string") {
        imageUrl = uploadedImage;
      } else {
        return res.status(500).json({
          success: false,
          message: "Invalid image URL received from ImgBB",
        });
      }
    }

    // ======================================================
    // CREATE MARKET
    // ======================================================

    const market = await Market.create({
      name: name.trim(),
      marketId: marketId.trim(),

      openTime,
      closeTime,
      resultTime,

      minBid:
        minBid !== undefined && minBid !== null && minBid !== ""
          ? Number(minBid)
          : 10,

      maxBid:
        maxBid !== undefined && maxBid !== null && maxBid !== ""
          ? Number(maxBid)
          : 10000,

      description: description ? description.trim() : "",

      // IMPORTANT:
      // Always save string URL
      image: imageUrl,

      createdBy: req.user.id,

      isActive: true,
      isResultDeclared: false,
    });

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(201).json({
      success: true,
      message: "Market created successfully",
      data: market,
    });
  } catch (error) {
    console.error("CREATE MARKET ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// UPDATE MARKET
// ==========================================================

exports.updateMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    // ======================================================
    // CHECK MARKET ID
    // ======================================================

    const existingMarket = await Market.findById(marketId);

    if (!existingMarket) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // ======================================================
    // COPY BODY
    // ======================================================

    const updateData = {
      ...req.body,
    };

    // ======================================================
    // REMOVE PROTECTED / UNWANTED FIELDS
    // ======================================================

    delete updateData.createdBy;

    delete updateData.gameTypes;
    delete updateData.gameType;
    delete updateData.winningMultiplier;

    // ======================================================
    // NAME
    // ======================================================

    if (updateData.name) {
      updateData.name = updateData.name.trim();

      const existingName = await Market.findOne({
        name: updateData.name,
        _id: {
          $ne: marketId,
        },
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: "Market name already exists",
        });
      }
    }

    // ======================================================
    // MARKET ID
    // ======================================================

    if (updateData.marketId) {
      updateData.marketId = updateData.marketId.trim();

      const existingId = await Market.findOne({
        marketId: updateData.marketId,
        _id: {
          $ne: marketId,
        },
      });

      if (existingId) {
        return res.status(400).json({
          success: false,
          message: "Market ID already exists",
        });
      }
    }

    // ======================================================
    // NUMBER FIELDS
    // ======================================================

    if (updateData.minBid !== undefined && updateData.minBid !== "") {
      updateData.minBid = Number(updateData.minBid);
    }

    if (updateData.maxBid !== undefined && updateData.maxBid !== "") {
      updateData.maxBid = Number(updateData.maxBid);
    }

    // ======================================================
    // DESCRIPTION
    // ======================================================

    if (updateData.description !== undefined) {
      updateData.description = updateData.description?.trim() || "";
    }

    // ======================================================
    // IMAGE UPLOAD
    // ======================================================

    if (req.file) {
      const uploadedImage = await uploadToImgBB(req.file);

      console.log("ImgBB update response:", uploadedImage);
      console.log("ImgBB update response type:", typeof uploadedImage);

      if (typeof uploadedImage !== "string") {
        return res.status(500).json({
          success: false,
          message: "Invalid image URL received from ImgBB",
        });
      }

      updateData.image = uploadedImage;
    }

    // ======================================================
    // VERY IMPORTANT
    // ======================================================
    // If no new image is uploaded, don't touch old image.
    //
    // If somehow frontend sends image as an object,
    // remove it instead of sending object to MongoDB.

    if (
      updateData.image !== undefined &&
      typeof updateData.image !== "string"
    ) {
      delete updateData.image;
    }

    // ======================================================
    // UPDATE
    // ======================================================

    const market = await Market.findByIdAndUpdate(marketId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,
      message: "Market updated successfully",
      data: market,
    });
  } catch (error) {
    console.error("UPDATE MARKET ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// GET ALL MARKETS
// ==========================================================

exports.getAllMarkets = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);

    const currentLimit = Math.max(parseInt(limit, 10) || 20, 1);

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const markets = await Market.find(filter)
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1,
      })
      .skip((currentPage - 1) * currentLimit)
      .limit(currentLimit);

    const total = await Market.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: markets,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        pages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    console.error("GET ALL MARKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// GET MARKET BY ID
// ==========================================================

exports.getMarketById = async (req, res) => {
  try {
    const { marketId } = req.params;

    const market = await Market.findById(marketId).populate(
      "createdBy",
      "name email",
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error("GET MARKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// TOGGLE MARKET STATUS
// ==========================================================

exports.toggleMarketStatus = async (req, res) => {
  try {
    const { marketId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const market = await Market.findByIdAndUpdate(
      marketId,
      {
        isActive,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Market ${isActive ? "activated" : "deactivated"} successfully`,
      data: market,
    });
  } catch (error) {
    console.error("TOGGLE MARKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// GET ACTIVE MARKETS
// ==========================================================

exports.getActiveMarkets = async (req, res) => {
  try {
    const markets = await Market.find({
      isActive: true,
    })
      .select(
        "name marketId openTime closeTime resultTime minBid maxBid description image",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: markets,
    });
  } catch (error) {
    console.error("GET ACTIVE MARKETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// DELETE MARKET
// ==========================================================

exports.deleteMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    const market = await Market.findByIdAndDelete(marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Market deleted successfully",
    });
  } catch (error) {
    console.error("DELETE MARKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
