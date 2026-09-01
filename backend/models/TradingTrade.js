const mongoose = require("mongoose");

const tradingTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    roundId: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    direction: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },

    entryValue: {
      type: Number,
      required: true,
    },

    exitValue: {
      type: Number,
      default: null,
    },

    result: {
      type: String,
      enum: ["pending", "won", "lost", "cancelled"],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

tradingTradeSchema.index(
  { userId: 1, roundId: 1, status: 1 }
);

module.exports =
  mongoose.models.TradingTrade ||
  mongoose.model("TradingTrade", tradingTradeSchema);
