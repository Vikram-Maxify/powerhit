const ExcelJS = require("exceljs");
const bcrypt = require("bcryptjs");  // ✅ Fixed: bcryptjs sahi tarike se
const jwt = require("jsonwebtoken");
const fs = require("fs");

const User = require("../models/authmodel");
const Bet = require("../models/TradeBet");
const Recharge = require("../models/TradeRecharge");
const Withdrawal = require("../models/TradeWithdrawal");
const Transaction = require("../models/TradeTransaction");
const Trade = require("../models/Trade");
const Admin = require("../models/TradeAdmin");
const Promocode = require("../models/Promocode");
const Leaderboard = require("../models/TradeLeaderboard");

const {
  timerJoin,
  timerJoinToday,
} = require("../utils/Timer");

const {
  uploadImage,
} = require("../utils/uploadImage");


// =====================================================
// HELPERS
// =====================================================

const num = (v) =>
  Number.isFinite(Number(v)) ? Number(v) : 0;

const pageArgs = (q) => {
  const p = Math.max(parseInt(q.pageno) || 1, 1);
  const to = Math.max(parseInt(q.pageto) || 10, p);
  const limit = to - p + 1;

  return {
    p,
    limit,
    skip: (p - 1) * limit,
  };
};

const userFilter = (s) =>
  s
    ? {
        userId: new RegExp(
          "^" +
            String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        ),
      }
    : {};

async function list(Model, filter, q) {
  const { p, limit, skip } = pageArgs(q);

  const [data, length] = await Promise.all([
    Model.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Model.countDocuments(filter),
  ]);

  return {
    data,
    length,
    p,
    limit,
  };
}


// =====================================================
// BET LIST
// =====================================================

exports.betlist = async (req, res) => {
  try {
    const x = await list(
      Bet,
      {
        status: {
          $in: [1, 2],
        },
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No active bets found.",
      });
    }

    return res.json({
      success: true,
      message: "Bet details retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// PENDING BET LIST
// =====================================================

exports.pendingBetlist = async (req, res) => {
  try {
    const x = await list(
      Bet,
      {
        status: 0,
      },
      req.query
    );

    const [totalMoneyDown, totalMoneyUp] =
      await Promise.all([
        Bet.countDocuments({
          status: 0,
          bet: "down",
        }),

        Bet.countDocuments({
          status: 0,
          bet: "up",
        }),
      ]);

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No active bets found.",
      });
    }

    return res.json({
      success: true,
      message: "Bet details retrieved successfully.",
      data: x.data,
      length: x.length,
      totalMoney: x.length,
      totalMoneyDown,
      totalMoneyUp,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// ALL USERS
// =====================================================

exports.allUsers = async (req, res) => {
  try {
    const x = await list(
      User,
      userFilter(req.query.userId),
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    return res.json({
      success: true,
      message: "User details retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// USER INFO
// =====================================================

exports.userInfo = async (req, res) => {
  try {
    const u = await User.find({
      userId: Number(req.body.userId),
    })
      .select("-plane_password")
      .lean();

    if (!u.length) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: "User information retrieved successfully.",
      data: u,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// USER RECHARGE
// =====================================================

exports.userRecharge = async (req, res) => {
  try {
    const x = await list(
      Recharge,
      {
        userId: Number(req.body.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No recharge found.",
      });
    }

    return res.json({
      success: true,
      message: "User recharge retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// USER WITHDRAWAL
// =====================================================

exports.userWithdrawal = async (req, res) => {
  try {
    const x = await list(
      Withdrawal,
      {
        userId: Number(req.body.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No withdrawal found.",
      });
    }

    return res.json({
      success: true,
      message: "User withdrawal retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// USER BET
// =====================================================

exports.userBet = async (req, res) => {
  try {
    const x = await list(
      Bet,
      {
        userId: Number(req.body.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No bet found.",
      });
    }

    return res.json({
      success: true,
      message: "User bet retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// PENDING RECHARGE
// =====================================================

exports.pendingRecharge = async (req, res) => {
  try {
    const x = await list(
      Recharge,
      {
        status: 0,
        ...userFilter(req.query.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No recharge found.",
      });
    }

    return res.json({
      success: true,
      message: "Recharge retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// RECHARGE LIST
// =====================================================

exports.rechargeList = async (req, res) => {
  try {
    const x = await list(
      Recharge,
      {
        status: {
          $ne: 0,
        },
        ...userFilter(req.query.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No recharge found.",
      });
    }

    return res.json({
      success: true,
      message: "Recharge retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// PENDING WITHDRAWAL
// =====================================================

exports.pendingWithdrawal = async (req, res) => {
  try {
    const x = await list(
      Withdrawal,
      {
        status: 0,
        ...userFilter(req.query.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No withdrawal found.",
      });
    }

    return res.json({
      success: true,
      message: "Withdrawal retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// WITHDRAWAL LIST
// =====================================================

exports.withdrawalList = async (req, res) => {
  try {
    const x = await list(
      Withdrawal,
      {
        status: {
          $ne: 0,
        },
        ...userFilter(req.query.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No withdrawal found.",
      });
    }

    return res.json({
      success: true,
      message: "Withdrawal retrieved successfully.",
      data: x.data,
      length: x.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// APPROVE / REJECT WITHDRAWAL
// =====================================================

exports.approveWithdrawal = async (req, res) => {  // ✅ Fixed: aprrove → approve
  try {
    const { status, orderId } = req.body;

    const w = await Withdrawal.findOne({
      orderId,
    });

    if (!w) {
      return res.status(404).json({
        success: false,
        message: "No withdrawal found.",
      });
    }

    if (w.status !== 0) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed",
      });
    }

    const t = timerJoin(Date.now());

    // APPROVE
    if (Number(status) === 1) {
      const updated = await Withdrawal.findOneAndUpdate(
        {
          _id: w._id,
          status: 0,
        },
        {
          $set: {
            status: 1,
            time: t,
          },
        },
        {
          new: true,
        }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Withdrawal already processed",
        });
      }

      await Transaction.create({
        userId: w.userId,
        amount: w.amount,
        remark: "Approved withdrawal",
        time: t,
        status: 1,
        orderId,
      });
    }

    // REJECT
    else if (Number(status) === 2 || Number(status) === 0) {
      const updated = await Withdrawal.findOneAndUpdate(
        {
          _id: w._id,
          status: 0,
        },
        {
          $set: {
            status: 2,
            time: t,
          },
        },
        {
          new: true,
        }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Withdrawal already processed",
        });
      }

      // RETURN WITHDRAWAL AMOUNT TO USER BALANCE
      await User.updateOne(
        {
          userId: w.userId,
        },
        {
          $inc: {
            balance: num(w.amount),
          },
        }
      );

      await Transaction.create({
        userId: w.userId,
        amount: w.amount,
        remark: "Rejected withdrawal",
        time: t,
        status: 1,
        orderId,
      });
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal status",
      });
    }

    return res.json({
      success: true,
      message: "Withdrawal approved successfully.",
      data: [w],
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// APPROVE / REJECT RECHARGE
// =====================================================

exports.approveRecharge = async (req, res) => {  // ✅ Fixed: aprrove → approve
  try {
    const { status, orderId } = req.body;

    const r = await Recharge.findOne({
      orderId,
    });

    if (!r) {
      return res.status(404).json({
        success: false,
        message: "No recharge found.",
      });
    }

    if (r.status !== 0) {
      return res.status(400).json({
        success: false,
        message: "Recharge already processed",
      });
    }

    const t = timerJoin(Date.now());

    // APPROVE RECHARGE
    if (Number(status) === 1) {
      const updated = await Recharge.findOneAndUpdate(
        {
          _id: r._id,
          status: 0,
        },
        {
          $set: {
            status: 1,
            time: t,
          },
        },
        {
          new: true,
        }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Recharge already processed",
        });
      }

      const amount =
        num(r.amount) +
        num(r.bonus);

      // ADD RECHARGE TO USER BALANCE
      await User.updateOne(
        {
          userId: r.userId,
        },
        {
          $inc: {
            balance: amount,
            recharge: amount,
          },
        }
      );

      await Transaction.create({
        userId: r.userId,
        amount: r.amount,
        remark: "Approved recharge",
        time: t,
        status: 1,
        orderId,
      });
    }

    // REJECT RECHARGE
    else if (Number(status) === 2 || Number(status) === 0) {
      const updated = await Recharge.findOneAndUpdate(
        {
          _id: r._id,
          status: 0,
        },
        {
          $set: {
            status: 2,
            time: t,
          },
        },
        {
          new: true,
        }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Recharge already processed",
        });
      }

      await Transaction.create({
        userId: r.userId,
        amount: r.amount,
        remark: "Rejected recharge",
        time: t,
        status: 2,
        orderId,
      });
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid recharge status",
      });
    }

    return res.json({
      success: true,
      message: "Recharge approved successfully.",
      data: [r],
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// ADMIN RESULT
// =====================================================

exports.adminResult = async (req, res) => {
  try {
    const b = {};

    for (const k of [
      "trade",
      "control",
      "telegram",
      "usdt",
      "usdt2",
      "usdt3",
      "usdtImg",
      "usdtImg2",
      "usdtImg3",
    ]) {
      if (
        req.body[k] !== undefined &&
        req.body[k] !== null &&
        req.body[k] !== ""
      ) {
        b[k] = req.body[k];
      }
    }

    if (req.body.result !== undefined) {
      b.trade = req.body.result;
      b.control = req.body.result;
    }

    const data =
      await Admin.findOneAndUpdate(
        {},
        {
          $set: b,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.json({
      success: true,
      message: "Update successfully.",
      data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// ADMIN GET
// =====================================================

exports.adminget = async (req, res) => {
  try {
    let data = await Admin.findOne().lean();

    if (!data) {
      data = await Admin.create({});
    }

    return res.json({
      success: true,
      message: "Get admin successfully.",
      data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// INCREASE / DECREASE USER BALANCE
// =====================================================

exports.increaseMoney = async (req, res) => {
  try {
    const {
      money,
      userId,
      type,
    } = req.body;

    const amount = num(money);
    const uid = Number(userId);

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid money",
      });
    }

    const filter = {
      userId: uid,
    };

    const user = await User.findOne(filter);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // INCREASE BALANCE
    if (type === "increase") {
      await User.updateOne(
        filter,
        {
          $inc: {
            balance: amount,
          },
        }
      );
    }

    // DECREASE BALANCE
    else if (type === "decrease") {
      const updated =
        await User.findOneAndUpdate(
          {
            ...filter,
            balance: {
              $gte: amount,
            },
          },
          {
            $inc: {
              balance: -amount,
            },
          },
          {
            new: true,
          }
        );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance",
        });
      }
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    const updatedUser =
      await User.findOne(filter)
        .select("-password -plane_password")
        .lean();

    return res.json({
      success: true,
      message: "Balance updated successfully.",
      data: updatedUser,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// CONVERT USER / AGENT
// =====================================================

exports.convertAdmin = async (req, res) => {
  try {
    const u =
      await User.findOneAndUpdate(
        {
          userId: Number(req.body.userId),
        },
        {
          $set: {
            role: Number(req.body.value),
          },
        },
        {
          new: true,
        }
      );

    if (!u) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User role updated successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// BLOCK USER
// =====================================================

exports.blockUser = async (req, res) => {
  try {
    const u =
      await User.findOneAndUpdate(
        {
          userId: Number(req.body.userId),
        },
        {
          $set: {
            status: Number(req.body.value),
          },
        },
        {
          new: true,
        }
      );

    if (!u) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// CREATE AGENT
// =====================================================

exports.createAgent = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    if (
      await User.exists({
        email: normalizedEmail,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered",
      });
    }

    const last =
      await User.findOne()
        .sort({
          userId: -1,
        })
        .select("userId")
        .lean();

    const userId =
      last?.userId
        ? last.userId + 1
        : 100001;

    // ✅ Fixed: bcrypt se hash karo
    const hashedPassword = await bcrypt.hash(password, 10);

    const u = await User.create({
      userId,
      name: "Unknown",
      email: normalizedEmail,
      password: hashedPassword,  // ✅ Hashed password store karo
      plane_password: password,   // Plain password display ke liye
      country: "INDIA",
      currency: "USD",
      role: 2,
      balance: 0,
      deposit: 0,
      recharge: 0,
    });

    u.token = jwt.sign(
      {
        userId,
        email: u.email,
      },
      process.env.JWT_SECRET || "santosh",
      {
        expiresIn: "7d",
      }
    );

    await u.save();

    return res.status(201).json({
      success: true,
      message: "Agent registered successfully",
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};


// =====================================================
// ALL AGENTS
// =====================================================

exports.allAgent = async (req, res) => {
  try {
    const x = await list(
      User,
      {
        role: 2,
        ...userFilter(req.query.userId),
      },
      req.query
    );

    if (!x.data.length) {
      return res.status(404).json({
        success: false,
        message: "No agents found.",
      });
    }

    return res.json({
      success: true,
      message: "Agent details retrieved successfully.",
      data: x.data,
      length: x.length,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// ALL ADMIN DATA
// =====================================================

exports.allAdminData = async (req, res) => {
  try {
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const [
      totalActiveUser,
      totalUserBalance,
      todayUser,
      totalBlockUser,
      totalBetLoss,
      totalBetWin,
      totalRecharge,
      todayRecharge,
      totalWithdrawal,
      todayWithdrawal,
    ] = await Promise.all([
      // ACTIVE USERS
      User.countDocuments({
        status: 0,
      }),

      // USERS HAVING BALANCE FIELD
      User.countDocuments({
        status: 0,
        balance: {
          $exists: true,
        },
      }),

      // TODAY USERS
      User.countDocuments({
        status: 0,
        createdAt: {
          $gte: start,
        },
      }),

      // BLOCKED USERS
      User.countDocuments({
        status: 2,
      }),

      // BET LOSS
      Bet.countDocuments({
        status: 2,
      }),

      // BET WIN
      Bet.countDocuments({
        status: 1,
      }),

      // TOTAL APPROVED RECHARGE
      Recharge.countDocuments({
        status: 1,
      }),

      // TODAY RECHARGE
      Recharge.countDocuments({
        status: 1,
        createdAt: {
          $gte: start,
        },
      }),

      // TOTAL APPROVED WITHDRAWAL
      Withdrawal.countDocuments({
        status: 1,
      }),

      // TODAY WITHDRAWAL
      Withdrawal.countDocuments({
        status: 1,
        createdAt: {
          $gte: start,
        },
      }),
    ]);

    return res.json({
      success: true,
      message: "Admin data retrieved successfully.",

      totalActiveUser,

      // renamed from totalUserMoney
      totalUserBalance,

      todayUser,
      totalBlockUser,
      totalBetLoss,
      totalBetWin,
      totalRecharge,
      todayRecharge,
      totalWithdrawal,
      todayWithdrawal,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// DOWNLOAD TODAY RECHARGE / BET DATA
// =====================================================

exports.downloadTodayRecharge = async (req, res) => {  // ✅ Fixed: Reachrge → Recharge
  try {
    const rows =
      await Bet.find({
        status: 1,
      }).lean();

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    const wb = new ExcelJS.Workbook();

    const ws = wb.addWorksheet("Bets");

    const keys = Object.keys(rows[0]);

    ws.columns = keys.map((k) => ({
      header: k.toUpperCase(),
      key: k,
      width: 20,
    }));

    rows.forEach((r) => {
      ws.addRow(
        Object.fromEntries(
          keys.map((k) => [
            k,
            r[k],
          ])
        )
      );
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bets.xlsx"
    );

    await wb.xlsx.write(res);

    res.end();

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e.message,
    });
  }
};


// =====================================================
// CREATE PROMOCODE
// =====================================================

exports.createPromocode = async (req, res) => {
  try {
    const {
      percent,
      deposit,
      code,
    } = req.body;

    if (!percent || !deposit || !code) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedCode =
      String(code)
        .trim()
        .toUpperCase();

    if (
      await Promocode.exists({
        code: normalizedCode,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "This code already exists",
      });
    }

    await Promocode.create({
      code: normalizedCode,
      percent: num(percent),
      deposit: num(deposit),
      time: timerJoin(Date.now()),
      status: 1,
    });

    return res.status(201).json({
      success: true,
      message: "Created successfully",
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};


// =====================================================
// GET PROMOCODE
// =====================================================

exports.getPromocode = async (req, res) => {
  try {
    const data =
      await Promocode.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data,
      message: "Get successfully",
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};


// =====================================================
// ADD LEADERBOARD
// =====================================================

exports.addLeaderboard = async (req, res) => {
  try {
    const {
      name,
      price,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }

    let image = null;

    if (req.file) {
      try {
        image = await uploadImage(
          req.file.path
        );
      } finally {
        fs.unlink(
          req.file.path,
          () => {}
        );
      }
    }

    await Leaderboard.create({
      name,
      price: num(price),
      image,
      time: timerJoin(Date.now()),
    });

    return res.json({
      success: true,
      message: "Leaderboard added successfully",
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};


// =====================================================
// GET LEADERBOARD
// =====================================================

exports.getLeader = async (req, res) => {
  try {
    const data =
      await Leaderboard.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data,
      message: "Get successfully",
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};