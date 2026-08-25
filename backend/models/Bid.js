const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },

    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: true,
      index: true,
    },

    gameType: {
      type: String,
      enum: [
        "single",
        "jodi",
        "panna",
        "half-sangam",
        "full-sangam",
        "last-digit",
        "first-digit",
      ],
      required: true,
    },

    // Game Number
    number: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          const str = String(value).trim();
          
          switch (this.gameType) {
            case "single":
              // Single: 0-9
              return /^[0-9]$/.test(str);

            case "jodi":
              // Jodi: 00-99
              return /^[0-9]{2}$/.test(str);

            case "full-sangam":
              // Full-Sangam: 2-digit number
              return /^[0-9]{2}$/.test(str);

            case "last-digit":
              // Last Digit: User bids on any 2-digit number (00-99)
              // The last digit will be checked against winning number's last digit
              return /^[0-9]{2}$/.test(str);

            case "first-digit":
              // First Digit: User bids on any 2-digit number (00-99)
              // The first digit will be checked against winning number's first digit
              return /^[0-9]{2}$/.test(str);

            default:
              return false;
          }
        },
        message: function(props) {
          const gameTypeMap = {
            'single': 'single digit (0-9)',
            'jodi': '2-digit number (00-99)',
            'full-sangam': '2-digit number (00-99)',
            'last-digit': '2-digit number (00-99)',
            'first-digit': '2-digit number (00-99)'
          };
          return `Invalid number for ${this.gameType}. Expected format: ${gameTypeMap[this.gameType] || 'valid number'}`;
        },
      },
    },

    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    possibleWinAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "won", "lost", "cancelled"],
      default: "pending",
    },

    winAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    resultNumber: {
      type: String,
      default: null,
    },

    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    remarks: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
bidSchema.index({ userId: 1, createdAt: -1 });
bidSchema.index({ marketId: 1, status: 1 });
bidSchema.index({ transactionId: 1 });
bidSchema.index({ userId: 1, status: 1 });
bidSchema.index({ marketId: 1, createdAt: -1 });

// Virtual field for display
bidSchema.virtual('numberDisplay').get(function() {
  return this.number;
});

// Pre-save middleware to format number
bidSchema.pre('save', function(next) {
  // Format number with leading zeros for 2-digit games
  if (['jodi', 'full-sangam', 'last-digit', 'first-digit'].includes(this.gameType)) {
    this.number = String(this.number).trim().padStart(2, '0');
  }
  // Format number with leading zeros for 3-digit games
  // else if (this.gameType === 'panna') {
  //   this.number = String(this.number).trim().padStart(3, '0');
  // }
});

// Method to check if bid won
bidSchema.methods.checkWin = function(winningNumber) {
  const winningNumStr = String(winningNumber).trim();
  const bidNumStr = String(this.number).trim();
  
  switch (this.gameType) {
    case 'single':
      return winningNumStr === bidNumStr;
      
    case 'jodi':
      return winningNumStr === bidNumStr;
      
    // case 'panna':
    //   return winningNumStr === bidNumStr;
      
    // case 'half-sangam':
    //   // Check if either 1-digit or 3-digit matches
    //   return winningNumStr === bidNumStr || 
    //          winningNumStr.slice(-1) === bidNumStr.slice(-1);
             
    case 'full-sangam':
      // Check last 2 digits
      return winningNumStr.slice(-2) === bidNumStr;
      
    case 'last-digit':
      // Check if last digit matches
      const bidLastDigit = bidNumStr.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;
      
    case 'first-digit':
      // Check if first digit matches
      const bidFirstDigit = bidNumStr.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;
      
    default:
      return false;
  }
};

// Static method to get bid statistics
bidSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$bidAmount' },
        totalWinAmount: { $sum: '$winAmount' }
      }
    }
  ]);
  return stats;
};

module.exports = mongoose.model("bids", bidSchema);