const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    marketId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    openTime: {
      type: String,
      required: true,
    },

    closeTime: {
      type: String,
      required: true,
    },

    resultTime: {
      type: String,
      required: true,
    },

    minBid: {
      type: Number,
      default: 10,
    },

    maxBid: {
      type: Number,
      default: 10000,
    },

    description: {
      type: String,
      default: "",
    },

    // Market Image
    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isResultDeclared: {
      type: Boolean,
      default: false,
    },

    winningNumber: {
      type: String,
      default: null,
    },

    resultDeclaredAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Market", marketSchema);