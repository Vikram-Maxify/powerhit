// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    time: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ phone: 1, createdAt: -1 });

module.exports = mongoose.model('transactions', transactionSchema);