const mongoose = require("mongoose");

const tradingRoundSchema = new mongoose.Schema(
  {
    roundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    startValue: {
      type: Number,
      required: true,
    },

    currentValue: {
      type: Number,
      required: true,
    },

    finalValue: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending",
      index: true,
    },

    startsAt: {
      type: Date,
      required: true,
    },

    endsAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.TradingRound ||
  mongoose.model("TradingRound", tradingRoundSchema);
