// controllers/betController.js
const User = require("../models/authmodel");
const Wingo = require("../models/Wingo");
const Bet = require("../models/Bet");
const Transaction = require("../models/Transaction");
const Commission = require("../models/Commission");
const Subordinate = require("../models/Subordinate");
const Level = require("../models/Level");
const Admin = require("../models/Admin");
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Recharge = require("../models/Recharge");
require("dotenv").config();

// ==================== HELPER FUNCTIONS ====================

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
};

function formatDate(params = "", addHours = 0) {
  let date = params ? new Date(Number(params)) : new Date();
  if (addHours !== 0) {
    date.setHours(date.getHours() + addHours);
  }

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type).value;

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
}

function formatDateOnly(params = "", addHours = 0) {
  let date = params ? new Date(Number(params)) : new Date();
  if (addHours !== 0) {
    date.setHours(date.getHours() + addHours);
  }

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type).value;

  return `${getPart("year")}${getPart("month")}${getPart("day")}`;
}

function generateRandomHash(length) {
  const characters = "abcdef0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

function shuffleArrayInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==================== PAGE RENDERERS ====================

const winGoPage = async (req, res) => {
  return res.render("bet/wingo/win.ejs");
};

const winGoPage3 = async (req, res) => {
  return res.render("bet/wingo/win3.ejs");
};

const winGoPage5 = async (req, res) => {
  return res.render("bet/wingo/win5.ejs");
};

const winGoPage10 = async (req, res) => {
  return res.render("bet/wingo/win10.ejs");
};

const trxPage = async (req, res) => {
  return res.render("bet/trx/trx.ejs");
};

const trxPage3 = async (req, res) => {
  return res.render("bet/trx/trx3.ejs");
};

const trxPage5 = async (req, res) => {
  return res.render("bet/trx/trx5.ejs");
};

const trxPage10 = async (req, res) => {
  return res.render("bet/trx/trx10.ejs");
};

// ==================== COMMISSION FUNCTIONS ====================

const commissions = async (auth, money) => {
  try {
    const user = await User.findOne({ token: auth, veri: 1 });
    if (!user) return;

    const levels = await Level.find().sort({ level: 1 });
    if (!levels.length) return;

    const checkTime2 = formatDate(Date.now());
    let uplines = [user];
    let count = 0;

    for (let i = 0; i < 6 && uplines.length > 0; i++) {
      const rosesFs = (money / 100) * (levels[i]?.f1 || 0);

      if (rosesFs > 0) {
        const upline = await User.findOne({ code: uplines[0].invite });
        if (upline) {
          count++;

          // Create commission record
          await Commission.create({
            phone: upline.phone,
            bonusby: uplines[0].phone,
            type: "Bet",
            commission: rosesFs,
            amount: money,
            level: count,
            date: checkTime2,
          });

          // Create subordinate record
          await Subordinate.create({
            phone: upline.phone,
            bonusby: uplines[0].phone,
            type: "bet commission",
            commission: rosesFs,
            amount: money,
            level: count,
            date: checkTime2,
          });

          // Update pending commission
          await User.updateOne(
            { phone: upline.phone },
            { $inc: { pending_commission: rosesFs } },
          );

          uplines = [upline];
        } else {
          break;
        }
      } else {
        break;
      }
    }
  } catch (error) {
    console.error("Commission error:", error);
  }
};

// ==================== BET PLACEMENT ====================

const betWinGo = async (req, res) => {
  try {
    let { typeid, join, x, money } = req.body;
    let auth = req.cookies.auth;

    const validTypeIds = [1, 3, 5, 10, 11, 33, 55, 100];
    if (!validTypeIds.includes(typeid)) {
      return res
        .status(400)
        .json({ message: "Invalid type id", status: false });
    }

    const gameMap = {
      1: "wingo",
      3: "wingo3",
      5: "wingo5",
      10: "wingo10",
      11: "trx",
      33: "trx3",
      55: "trx5",
      100: "trx10",
    };
    const gameJoin = gameMap[typeid];

    // Get current period
    const winGoNow = await Wingo.findOne({ status: 0, game: gameJoin })
      .sort({ _id: -1 })
      .limit(1);

    const user = await User.findOne({ token: auth, veri: 1 });
    if (!winGoNow || !user || !isNumber(x) || !isNumber(money)) {
      return res.status(400).json({ message: "Invalid data", status: false });
    }

    let period = winGoNow.period;
    let fee = x * money * 0.02;
    let total = x * money - fee;
    let check = user.balance - total;

    if (check < 0) {
      return res
        .status(400)
        .json({ message: "The amount is not enough", status: false });
    }

    // Check legal bet score
    if (user.legal_bet_score >= 3) {
      await User.updateOne({ phone: user.phone }, { status: 2 });
      const updatedUser = await User.findOne({ phone: user.phone });
      return res.status(403).json({
        message: "Your account is locked",
        status: true,
        change: updatedUser?.level || null,
        money: updatedUser?.money || 0,
      });
    }

    // Check recharge
    // const rechargeTotal = await Recharge.aggregate([
    //   { $match: { phone: user.phone, status: 1 } },
    //   { $group: { _id: null, total: { $sum: '$money' } } }
    // ]);
    // const rechargeAmount = rechargeTotal[0]?.total || 0;

    // if (rechargeAmount < money) {
    //   return res.status(200).json({
    //     message: 'Need to first recharge',
    //     status: false,
    //   });
    // }

    const recharge = await Recharge.findOne({ phone: user.phone, status: 1 });
    if (!recharge) {
      return res.status(200).json({
        message: "Need to first recharge",
        status: false,
      });
    }

    const date = new Date();
    const id_product =
      formatDateOnly(date.getTime()) +
      Math.floor(Math.random() * 1000000000000000);
    const checkTime = formatDate(Date.now());

    // Create bet record
    await Bet.create({
      id_product,
      phone: user.phone,
      code: user.code,
      invite: user.invite,
      stage: period,
      level: user.level,
      money: total,
      amount: x,
      fee: fee,
      get: 0,
      game: gameJoin,
      bet: join,
      status: 0,
      today: checkTime,
      isdemo: user.isdemo || false,
    });

    const formattedToday = new Date().toISOString().split("T")[0];

    // Get admin settings
    const admin = await Admin.findOne();

    // Calculate total money
    const totalMoneyResult = await Bet.aggregate([
      {
        $match: {
          phone: user.phone,
          $expr: {
            $eq: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              formattedToday,
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$money" } } },
    ]);
    const totalMoney = totalMoneyResult[0]?.total || 0;

    // Check big and small scores
    const bigScore = await Bet.findOne({
      phone: user.phone,
      stage: period,
      bet: "l",
    });
    const smallScore = await Bet.findOne({
      phone: user.phone,
      stage: period,
      bet: "n",
    });

    if (bigScore && smallScore) {
      // Update legal bet score
      await User.updateOne({ token: auth }, { $inc: { legal_bet_score: 1 } });
    }

    // Update user balance
    await User.updateOne(
      { token: auth },
      {
        $inc: {
          money: -(money * x),
          rebate: money * x,
        },
      },
    );

    const updatedUser = await User.findOne({ token: auth, veri: 1 });

    // Update recharge
    let total_money = money * x;
    let total_recharge = Math.max(user.recharge - total_money, 0);
    await User.updateOne({ phone: user.phone }, { recharge: total_recharge });

    // Create transaction
    await Transaction.create({
      phone: user.phone,
      detail: "Bet",
      balance: total,
      time: checkTime,
    });

    // Process commissions
    await commissions(auth, money * x);

    res.status(200).json({
      message: "Bet Succeeded",
      status: true,
      change: updatedUser.level,
      money: updatedUser.money,
    });
  } catch (error) {
    console.error("Error in betWinGo:", error.message);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

// ==================== ORDER LIST ====================

const listOrderOld = async (req, res) => {
  try {
    let { typeid, pageno, pageto } = req.body;

    const validTypeIds = [1, 3, 5, 10, 11, 33, 55, 100];
    if (!validTypeIds.includes(typeid)) {
      return res
        .status(200)
        .json({ message: "Invalid type id", status: false });
    }

    if (pageno < 1 || pageto < 1) {
      return res.status(200).json({
        code: 0,
        msg: "No more data",
        data: { gameslist: [] },
        status: false,
      });
    }

    let auth = req.cookies.auth;
    const user = await User.findOne({ token: auth, veri: 1 });
    if (!user) {
      return res
        .status(200)
        .json({ message: "Error! user is missing.", status: false });
    }

    const gameMap = {
      1: "wingo",
      3: "wingo3",
      5: "wingo5",
      10: "wingo10",
      11: "trx",
      33: "trx3",
      55: "trx5",
      100: "trx10",
    };
    const game = gameMap[typeid];

    const offset = pageno - 1;
    const limit = pageto - pageno + 1;

    const wingo = await Wingo.find({ status: { $ne: 0 }, game })
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit);

    const wingoAll = await Wingo.find({ status: { $ne: 0 }, game });
    const period = await Wingo.findOne({ status: 0, game })
      .sort({ _id: -1 })
      .limit(1);

    if (!wingo.length) {
      return res.status(200).json({
        code: 0,
        msg: "No more data",
        data: { gameslist: [] },
        status: false,
      });
    }

    if (!period) {
      return res.status(200).json({
        message: "Error! period is missing.",
        status: false,
      });
    }

    let page = Math.ceil(wingoAll.length / limit);

    return res.status(200).json({
      code: 0,
      msg: "Get success",
      data: { gameslist: wingo },
      period: period.period,
      page: page,
      time: period.time,
      status: true,
    });
  } catch (error) {
    console.error("Error in listOrderOld:", error.message);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

// ==================== GET MY BET HISTORY ====================

const GetMyEmerdList = async (req, res) => {
  try {
    let { typeid, pageno, pageto } = req.body;

    const validTypeIds = [1, 3, 5, 10, 11, 33, 55, 100, 15];
    if (!validTypeIds.includes(typeid)) {
      return res
        .status(200)
        .json({ message: "Invalid type id", status: false });
    }

    if (pageno < 0 || pageto < 0) {
      return res.status(200).json({
        code: 0,
        msg: "No more data",
        data: { gameslist: [] },
        status: false,
      });
    }

    let auth = req.cookies.auth;
    const user = await User.findOne({ token: auth, veri: 1 });
    if (!user) {
      return res.status(200).json({
        code: 0,
        msg: "User not found",
        data: { gameslist: [] },
        status: false,
      });
    }

    const gameMap = {
      1: "wingo",
      3: "wingo3",
      5: "wingo5",
      10: "wingo10",
      11: "trx",
      33: "trx3",
      55: "trx5",
      100: "trx10",
    };

    if (typeid === 15) {
      const limit = 100;
      const offset = (1 - 1) * limit;

      const bets = await Bet.find({ phone: user.phone })
        .sort({ _id: -1 })
        .skip(offset)
        .limit(limit);

      return res.status(200).json({
        code: 0,
        msg: "Get success",
        data: { gameslist: bets },
        status: true,
      });
    }

    const game = gameMap[typeid];
    const offset = pageno - 1;
    const limit = pageto - pageno + 1;

    const bets = await Bet.find({ phone: user.phone, game })
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit);

    const betsAll = await Bet.find({ phone: user.phone, game });

    if (!bets || bets.length === 0) {
      return res.status(200).json({
        code: 0,
        msg: "No more data",
        data: { gameslist: [] },
        status: false,
      });
    }

    let page = Math.ceil(betsAll.length / 10);

    return res.status(200).json({
      code: 0,
      msg: "Get success data",
      data: { gameslist: bets },
      page: page,
      status: true,
    });
  } catch (error) {
    console.error("Error in GetMyEmerdList:", error.message);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

// ==================== HANDLE WIN RESULTS ====================

const handlingWinGo1P = async (typeid) => {
  try {
    const gameMap = {
      1: "wingo",
      3: "wingo3",
      5: "wingo5",
      10: "wingo10",
      11: "trx",
      33: "trx3",
      55: "trx5",
      100: "trx10",
    };
    const game = gameMap[typeid];

    // Get winning result
    const winGoNow = await Wingo.findOne({ status: { $ne: 0 }, game })
      .sort({ _id: -1 })
      .limit(1);

    if (!winGoNow) return;

    const result = Number(winGoNow.amount);

    // Update bet results based on win/lose
    const updateQuery = {
      $set: { result: result },
    };

    await Bet.updateMany({ status: 0, game }, { $set: { result: result } });

    // Determine winners based on bet type
    const betTypeMap = {
      0: { bet: ["0", "t", "d", "n", "l"], special: true },
      1: { bet: ["1", "x", "n", "l"], special: false },
      2: { bet: ["2", "d", "n", "l"], special: false },
      3: { bet: ["3", "x", "n", "l"], special: false },
      4: { bet: ["4", "d", "n", "l"], special: false },
      5: { bet: ["5", "t", "x", "n", "l"], special: true },
      6: { bet: ["6", "d", "n", "l"], special: false },
      7: { bet: ["7", "x", "n", "l"], special: false },
      8: { bet: ["8", "d", "n", "l"], special: false },
      9: { bet: ["9", "x", "n", "l"], special: false },
    };

    const betInfo = betTypeMap[result];
    if (!betInfo) return;

    // Mark losing bets
    const losingBets = await Bet.find({
      status: 0,
      game,
      bet: { $nin: betInfo.bet },
    });

    for (const bet of losingBets) {
      await Bet.updateOne({ _id: bet._id }, { status: 2 });
    }

    // Handle small/large
    if (result < 5) {
      await Bet.updateMany({ status: 0, game, bet: "l" }, { status: 2 });
    } else {
      await Bet.updateMany({ status: 0, game, bet: "n" }, { status: 2 });
    }

    // Get winning bets
    const winningBets = await Bet.find({ status: 0, game });

    const processBet = async (bet) => {
      let nhan_duoc = 0;
      let betType = bet.bet;
      let total = bet.money;
      let phone = bet.phone;

      if (betType === "l" || betType === "n") {
        nhan_duoc = total * 2;
      } else {
        if (result === 0 || result === 5) {
          if (betType === "d" || betType === "x") {
            nhan_duoc = total * 1.5;
          } else if (betType === "t") {
            nhan_duoc = total * 4.5;
          } else if (betType === "0" || betType === "5") {
            nhan_duoc = total * 4.5;
          }
        } else {
          const specialMap = {
            1: { bet: "1", special: "x" },
            2: { bet: "2", special: "d" },
            3: { bet: "3", special: "x" },
            4: { bet: "4", special: "d" },
            6: { bet: "6", special: "d" },
            7: { bet: "7", special: "x" },
            8: { bet: "8", special: "d" },
            9: { bet: "9", special: "x" },
          };

          const specialInfo = specialMap[result];
          if (specialInfo) {
            if (betType === specialInfo.bet) {
              nhan_duoc = total * 9;
            } else if (betType === specialInfo.special) {
              nhan_duoc = total * 2;
            }
          }
        }
      }

      if (nhan_duoc > 0) {
        let checkTime2 = formatDate(Date.now());

        await Bet.updateOne(
          { _id: bet._id },
          { $set: { get: nhan_duoc, status: 1 } },
        );

        await Transaction.create({
          phone: phone,
          detail: "Win",
          balance: nhan_duoc,
          time: checkTime2,
        });

        await User.updateOne({ phone: phone }, { $inc: { money: nhan_duoc } });
      } else {
        await Bet.updateOne({ _id: bet._id }, { status: 2 });
      }
    };

    for (const bet of winningBets) {
      await processBet(bet);
    }
  } catch (error) {
    console.error("Error in handlingWinGo1P:", error.message);
  }
};

// ==================== TRADE COMMISSION ====================

const tradeCommission = async () => {
  try {
    const users = await User.find({ pending_commission: { $gt: 0 } });

    if (users.length === 0) {
      console.log("No users with pending commission.");
      return;
    }

    const sumdate = formatDate(Date.now());

    for (const user of users) {
      await User.updateOne(
        { phone: user.phone },
        {
          $inc: { money: user.pending_commission },
          $set: { pending_commission: 0 },
        },
      );

      await Transaction.create({
        phone: user.phone,
        detail: "Agent Commission",
        balance: user.pending_commission,
        time: sumdate,
      });
    }
  } catch (error) {
    console.error("Error processing commissions:", error);
  }
};

const tradeCommissionadmin = async (req, res) => {
  try {
    const users = await User.find({ pending_commission: { $gt: 0 } });

    if (users.length === 0) {
      return res.status(200).json({
        message: "No users with pending commission!",
        status: true,
      });
    }

    const sumdate = formatDate(Date.now());

    for (const user of users) {
      await User.updateOne(
        { phone: user.phone },
        {
          $inc: { money: user.pending_commission },
          $set: { pending_commission: 0 },
        },
      );

      await Transaction.create({
        phone: user.phone,
        detail: "Agent Commission",
        balance: user.pending_commission,
        time: sumdate,
      });
    }

    return res.status(200).json({
      message: "commission Successfully!",
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error!",
      status: false,
    });
  }
};

const tradeCommissionGet = async (req, res) => {
  try {
    const users = await User.find({ pending_commission: { $gt: 0 } });
    return res.status(200).json({
      message: "commission Successfully!",
      status: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error!",
      status: false,
    });
  }
};

// ==================== API FETCH FUNCTIONS (30 Seconds) ====================

const maxApiRetries = 3;
const apiTimeout = 900;

const fetchApiData_bdgwin_10 = async () => {
  const ts = Date.now();
  const apiUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json?ts=${ts}`;

  const headers = {
    accept: "application/json, text/plain, */*",
  };

  let attempts = 0;

  while (attempts < maxApiRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), apiTimeout);
      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers,
        timeout: apiTimeout,
      });
      const endTime = Date.now();

      clearTimeout(timeout);

      if (endTime - startTime > apiTimeout) {
        attempts++;
        continue;
      }

      return response.data?.data?.list?.[0] || null;
    } catch (error) {
      attempts++;
      console.error(`API call failed (Attempt ${attempts}):`, error.message);
      if (attempts >= maxApiRetries) {
        throw new Error("API failed after maximum retries");
      }
    }
  }
  return null;
};

// ==================== DEFINERESULT (30 Seconds) ====================

const defineresult = async (game) => {
  try {
    const gameMappings = {
      1: { join: "wingo", updatenum: 1 },
      3: { join: "wingo3", updatenum: 2 },
      5: { join: "wingo5", updatenum: 3 },
      10: { join: "wingo10", updatenum: 4 },
      11: { join: "trx", updatenum: 3 },
      33: { join: "trx3", updatenum: 4 },
      55: { join: "trx5", updatenum: 5 },
      100: { join: "trx10", updatenum: 6 },
    };

    const { join, updatenum } = gameMappings[game] || {};
    if (!join) throw new Error("Invalid game type provided");

    const winGoNow = await Wingo.findOne({ status: 0, game: join })
      .sort({ _id: -1 })
      .limit(1);

    if (!winGoNow) {
      return Math.floor(Math.random() * 10);
    }

    const period = winGoNow.period;

    const betColumns = [
      { name: "red_small", bets: ["0", "2", "4", "d", "n"] },
      { name: "red_big", bets: ["6", "8", "d", "l"] },
      { name: "green_big", bets: ["5", "7", "9", "x", "l"] },
      { name: "green_small", bets: ["1", "3", "x", "n"] },
      { name: "violet_small", bets: ["0", "t", "n"] },
      { name: "violet_big", bets: ["5", "t", "l"] },
    ];

    shuffleArrayInPlace(betColumns);

    const categories = await Promise.all(
      betColumns.map(async (column) => {
        const result = await Bet.aggregate([
          {
            $match: {
              game: join,
              status: 0,
              isdemo: false,
              bet: { $in: column.bets },
            },
          },
          { $group: { _id: null, total_money: { $sum: "$money" } } },
        ]);

        return {
          name: column.name,
          total_money: parseInt(result[0]?.total_money) || 0,
        };
      }),
    );

    shuffleArrayInPlace(categories);

    const smallestCategory = categories.reduce((smallest, category) =>
      !smallest || category.total_money < smallest.total_money
        ? category
        : smallest,
    );

    const [color, size] = smallestCategory.name.split("_");
    const availableBets =
      betColumns.find((col) => col.name === `${color}_${size}`)?.bets || [];
    const validBets = availableBets.filter((bet) => !isNaN(parseInt(bet, 10)));

    const randomIndex = Math.floor(Math.random() * validBets.length);
    return parseInt(validBets[randomIndex], 10);
  } catch (error) {
    console.error("Error in defineresult:", error);
    return Math.floor(Math.random() * 10);
  }
};

// ==================== ADD WINGO 30 SECOND ====================

const logFilePath = path.join(__dirname, "wingo30.log");
let lastCallTime30 = 0;
const lockDuration30 = 3000;

const addWinGo_30 = async (period_id) => {
  try {
    if (Date.now() - lastCallTime30 < lockDuration30) {
      return;
    }
    lastCallTime30 = Date.now();

    const join = "wingo10";
    const checkTime2 = formatDate(Date.now());

    // Get current period
    let winGoNow = await Wingo.findOne({ status: 0, game: join })
      .sort({ _id: -1 })
      .limit(1);

    let period = winGoNow?.period || "98778990";

    // Get admin settings
    const setting = await Admin.findOne();
    let nextResult = setting?.wingo10 || "-1";

    // Fetch new period data (30 seconds)
    let newPeriodData = await fetchNewPeriod_30(period_id);

    if (!newPeriodData) {
      console.error("No new period received. Aborting function.");
      return;
    }

    let { newPeriod, resultAmount, attempts } = newPeriodData;

    // Check if there are players
    const minPlayers = await Bet.countDocuments({ status: 0, game: join });

    if (minPlayers > 0) {
      if (setting?.wingo30_mode === 1) {
        resultAmount = await defineresult(10);
      }
    }

    // Update results
    let newArr = "";
    if (nextResult === "-1") {
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount: resultAmount, status: 1 } },
      );
      newArr = "-1";
    } else {
      let arr = nextResult.split("|");
      newArr = arr.length === 1 ? "-1" : arr.slice(1).join("|");
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount: Number(arr[0]), status: 1 } },
      );
    }

    // Update previous periods
    await Wingo.updateMany(
      { period: { $ne: newPeriod }, game: join },
      { $set: { status: 1 } },
    );

    // Insert new period
    await Wingo.create({
      period: String(newPeriod),
      amount: 0,
      game: join,
      status: 0,
      hashvalue: generateRandomHash(10),
      blocs: 50,
      time: checkTime2,
    });

    // Update admin settings
    await Admin.updateOne({}, { $set: { wingo10: newArr } });
  } catch (error) {
    console.error("Error in addWinGo_30:", error);
  }
};

const fetchNewPeriod_30 = async (currentPeriod) => {
  const maxAttempts = 10;
  const retryInterval = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const apiData = await fetchApiData_bdgwin_10();

      if (apiData?.issueNumber === currentPeriod) {
        return {
          newPeriod: (BigInt(currentPeriod) + BigInt(1)).toString(),
          resultAmount: apiData.number,
          attempts: attempt,
        };
      }
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }

  return null;
};

// ==================== ADD WINGO 1 MINUTE (KEPT FOR BACKWARDS COMPATIBILITY) ====================

const addWinGo_1 = async (period_id) => {
  try {
    if (Date.now() - lastCallTime30 < lockDuration30) {
      return;
    }
    lastCallTime30 = Date.now();

    const join = "wingo";
    const checkTime2 = formatDate(Date.now());

    let winGoNow = await Wingo.findOne({ status: 0, game: join })
      .sort({ _id: -1 })
      .limit(1);

    let period = winGoNow?.period || "98778990";
    const setting = await Admin.findOne();
    let nextResult = setting?.wingo || "-1";

    let newPeriodData = await fetchNewPeriod_1(period_id);

    if (!newPeriodData) {
      console.error("No new period received.");
      return;
    }

    let { newPeriod, resultAmount, attempts } = newPeriodData;

    const minPlayers = await Bet.countDocuments({ status: 0, game: join });

    if (minPlayers > 0) {
      if (setting?.wingo1_mode === 1) {
        resultAmount = await defineresult(1);
      }
    }

    let newArr = "";
    if (nextResult === "-1") {
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount: resultAmount, status: 1 } },
      );
      newArr = "-1";
    } else {
      let arr = nextResult.split("|");
      newArr = arr.length === 1 ? "-1" : arr.slice(1).join("|");
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount: Number(arr[0]), status: 1 } },
      );
    }

    await Wingo.updateMany(
      { period: { $ne: newPeriod }, game: join },
      { $set: { status: 1 } },
    );

    await Wingo.create({
      period: String(newPeriod),
      amount: 0,
      game: join,
      status: 0,
      hashvalue: generateRandomHash(10),
      blocs: 50,
      time: checkTime2,
    });

    await Admin.updateOne({}, { $set: { wingo: newArr } });
  } catch (error) {
    console.error("Error in addWinGo_1:", error);
  }
};

const fetchApiData_bdgwin_1 = async () => {
  const ts = Date.now();
  const apiUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?ts=${ts}`;

  const headers = {
    accept: "application/json, text/plain, */*",
  };

  let attempts = 0;

  while (attempts < maxApiRetries) {
    try {
      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers,
        timeout: apiTimeout,
      });
      const endTime = Date.now();

      if (endTime - startTime > apiTimeout) {
        attempts++;
        continue;
      }

      return response.data?.data?.list?.[0] || null;
    } catch (error) {
      attempts++;
      console.error(`API call failed (Attempt ${attempts}):`, error.message);
      if (attempts >= maxApiRetries) {
        throw new Error("API failed after maximum retries");
      }
    }
  }
  return null;
};

const fetchNewPeriod_1 = async (currentPeriod) => {
  const maxAttempts = 10;
  const retryInterval = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const apiData = await fetchApiData_bdgwin_1();

      if (apiData?.issueNumber === currentPeriod) {
        return {
          newPeriod: (BigInt(currentPeriod) + BigInt(1)).toString(),
          resultAmount: apiData.number,
          attempts: attempt,
        };
      }
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }

  return null;
};

// ==================== ADD WINGO 3 MINUTE ====================

let lastCallTime3 = 0;
const lockDuration3 = 3000;

const addWinGo_3 = async () => {
  try {
    if (Date.now() - lastCallTime3 < lockDuration3) return;
    lastCallTime3 = Date.now();

    const join = "wingo3";
    const checkTime2 = formatDate(Date.now());

    const winGoNow = await Wingo.findOne({ status: 0, game: join })
      .sort({ _id: -1 })
      .limit(1);

    let period = winGoNow?.period || "98778990";
    const setting = await Admin.findOne();

    let amount = Math.floor(Math.random() * 10);
    const minPlayers = await Bet.countDocuments({ status: 0, game: join });

    if (minPlayers > 0) {
      if (setting?.wingo3_mode === 1) {
        amount = await defineresult(3);
      } else {
        const latestData = await fetchLatestWingo3Data();
        if (latestData) {
          period = latestData.period;
          amount = latestData.amount;
        }
      }
    } else {
      const latestData = await fetchLatestWingo3Data();
      if (latestData) {
        period = latestData.period;
        amount = latestData.amount;
      }
    }

    let nextResult = setting?.wingo3 || "-1";
    let newArr = "";

    if (nextResult === "-1") {
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount, status: 1 } },
      );
      newArr = "-1";
    } else {
      let arr = nextResult.split("|");
      let result = arr[0];
      newArr = arr.length > 1 ? arr.slice(1).join("|") : "-1";
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount: Number(result), status: 1 } },
      );
    }

    const newPeriod = BigInt(period) + BigInt(1);
    const blockHeight = 50;

    await Wingo.create({
      period: String(newPeriod),
      amount: 0,
      game: join,
      status: 0,
      hashvalue: generateRandomHash(10),
      blocs: blockHeight,
      time: checkTime2,
    });

    await Admin.updateOne({}, { $set: { wingo3: newArr } });
  } catch (error) {
    console.error("addWinGo_3 error:", error.message);
  }
};

const fetchLatestWingo3Data = async () => {
  const ts = Date.now();
  const apiUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json?ts=${ts}`;
  const headers = { accept: "application/json, text/plain, */*" };

  let attempts = 0;
  const maxApiRetries = 3;
  const apiTimeout = 5000;

  while (attempts < maxApiRetries) {
    try {
      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers,
        timeout: apiTimeout,
      });
      const endTime = Date.now();

      if (endTime - startTime > apiTimeout) {
        attempts++;
        continue;
      }

      const latest = response.data?.data?.list?.[0];
      if (latest) {
        return { period: latest.issueNumber, amount: latest.number };
      }
      return null;
    } catch (error) {
      attempts++;
      console.error(`API call failed (Attempt ${attempts}):`, error.message);
      if (attempts >= maxApiRetries)
        throw new Error("API failed after maximum retries");
    }
  }
  return null;
};

// ==================== ADD WINGO 5 MINUTE ====================

let lastCallTime5 = 0;
const lockDuration5 = 3000;

const addWinGo_5 = async () => {
  try {
    if (Date.now() - lastCallTime5 < lockDuration5) return;
    lastCallTime5 = Date.now();

    const join = "wingo5";
    const checkTime2 = formatDate(Date.now());

    const winGoNow = await Wingo.findOne({ status: 0, game: join })
      .sort({ _id: -1 })
      .limit(1);

    let period = winGoNow?.period || "98778990";
    const setting = await Admin.findOne();

    let amount = Math.floor(Math.random() * 10);
    const minPlayers = await Bet.countDocuments({ status: 0, game: join });

    if (minPlayers > 0) {
      if (setting?.wingo5_mode === 1) {
        amount = await defineresult(5);
      } else {
        const latestData = await fetchLatestWingo5Data();
        if (latestData) {
          period = latestData.period;
          amount = latestData.amount;
        }
      }
    } else {
      const latestData = await fetchLatestWingo5Data();
      if (latestData) {
        period = latestData.period;
        amount = latestData.amount;
      }
    }

    let nextResult = setting?.wingo5 || "-1";
    let newArr = "";

    if (nextResult === "-1") {
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount, status: 1 } },
      );
      newArr = "-1";
    } else {
      let arr = nextResult.split("|");
      let result = arr[0];
      newArr = arr.length > 1 ? arr.slice(1).join("|") : "-1";
      await Wingo.updateOne(
        { period, game: join },
        { $set: { amount: Number(result), status: 1 } },
      );
    }

    const newPeriod = BigInt(period) + BigInt(1);
    const blockHeight = 50;

    await Wingo.create({
      period: String(newPeriod),
      amount: 0,
      game: join,
      status: 0,
      hashvalue: generateRandomHash(10),
      blocs: blockHeight,
      time: checkTime2,
    });

    await Admin.updateOne({}, { $set: { wingo5: newArr } });
  } catch (error) {
    console.error("addWinGo_5 error:", error.message);
  }
};

const fetchLatestWingo5Data = async () => {
  const ts = Date.now();
  const apiUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json?ts=${ts}`;
  const headers = { accept: "application/json, text/plain, */*" };

  let attempts = 0;
  const maxApiRetries = 3;
  const apiTimeout = 5000;

  while (attempts < maxApiRetries) {
    try {
      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers,
        timeout: apiTimeout,
      });
      const endTime = Date.now();

      if (endTime - startTime > apiTimeout) {
        attempts++;
        continue;
      }

      const latest = response.data?.data?.list?.[0];
      if (latest) {
        return { period: latest.issueNumber, amount: latest.number };
      }
      return null;
    } catch (error) {
      attempts++;
      console.error(`API call failed (Attempt ${attempts}):`, error.message);
      if (attempts >= maxApiRetries)
        throw new Error("API failed after maximum retries");
    }
  }
  return null;
};

// ==================== ADD TRX ====================

let lastCallTime11 = 0;
const lockDuration11 = 3000;

const addWinGo_11 = async (periodfromserver) => {
  try {
    if (Date.now() - lastCallTime11 < lockDuration11) return;
    lastCallTime11 = Date.now();

    const join = "trx";
    const checkTime2 = formatDate(Date.now());

    const winGoNow = await Wingo.findOne({ status: 0, game: join })
      .sort({ _id: -1 })
      .limit(1);

    let period = winGoNow?.period || "98778990";
    const setting = await Admin.findOne();

    let newPeriodData = await fetchNewPeriod_11(periodfromserver, join);

    if (!newPeriodData) {
      console.error("No new period received.");
      return;
    }

    let { newPeriod, resultAmount, attempts, hashvalue, blockNumber } =
      newPeriodData;

    if (newPeriod && period === newPeriod) {
      newPeriod = (BigInt(newPeriod) + BigInt(1)).toString();
    }

    const minPlayers = await Bet.countDocuments({ status: 0, game: join });

    if (minPlayers > 0) {
      if (setting?.trx_mode === 1) {
        resultAmount = await defineresult(11);
      }
    }

    let nextResult = setting?.trx || "-1";
    let newArr = "";

    if (nextResult === "-1") {
      await Wingo.updateOne(
        { period, game: join },
        {
          $set: {
            amount: resultAmount,
            hashvalue,
            blocs: blockNumber,
            status: 1,
          },
        },
      );
      newArr = "-1";
    } else {
      let arr = nextResult.split("|");
      newArr = arr.length === 1 ? "-1" : arr.slice(1).join("|");
      await Wingo.updateOne(
        { period, game: join },
        {
          $set: {
            amount: Number(arr[0]),
            hashvalue,
            blocs: blockNumber,
            status: 1,
          },
        },
      );
    }

    await Wingo.updateMany(
      { period: { $ne: newPeriod }, game: join },
      { $set: { status: 1 } },
    );

    await Wingo.create({
      period: String(newPeriod),
      amount: 0,
      game: join,
      status: 0,
      hashvalue: generateRandomHash(10),
      blocs: 50,
      time: checkTime2,
    });

    await Admin.updateOne({}, { $set: { trx: newArr } });
  } catch (error) {
    console.error("Error in addWinGo_11:", error);
  }
};

const fetchApiData_11 = async () => {
  const apiUrl =
    "https://draw.ar-lottery01.com/TrxWinGo/TrxWinGo_1M/GetHistoryIssuePage.json?ts=" +
    Date.now();

  const headers = {
    accept: "application/json, text/plain, */*",
  };

  let attempts = 0;

  while (attempts < maxApiRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), apiTimeout);

      const startTime = Date.now();
      const response = await axios.get(apiUrl, {
        headers,
        timeout: apiTimeout,
      });
      const endTime = Date.now();

      clearTimeout(timeout);

      if (!response.data) {
        throw new Error("No data received");
      }

      if (endTime - startTime > apiTimeout) {
        attempts++;
        continue;
      }

      return response.data?.data?.list?.[0] || null;
    } catch (error) {
      attempts++;
      console.error(`API call failed (Attempt ${attempts}):`, error.message);
      if (attempts >= maxApiRetries) {
        throw new Error("API failed after maximum retries");
      }
    }
  }
  return null;
};

const fetchNewPeriod_11 = async (currentPeriod, game) => {
  let attempts = 0;
  let apiPeriod = null;
  let apiData = null;

  while (true) {
    try {
      apiData = await fetchApiData_11();
      if (apiData) {
        apiPeriod = apiData.issueNumber;
        if (apiPeriod === currentPeriod) {
          break;
        }
      }
    } catch (error) {
      console.error("API call error:", error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
    attempts++;
  }

  const blockID = apiData.blockId;
  const lastFourChars = blockID.slice(-6);
  const formattedBlockID = `**${lastFourChars}`;

  return {
    newPeriod: (BigInt(apiPeriod) + BigInt(1)).toString(),
    resultAmount: apiData.number,
    hashvalue: formattedBlockID,
    blockNumber: apiData.blockNumber,
    attempts,
  };
};

// ==================== EXPORT ====================

module.exports = {
  winGoPage,
  winGoPage3,
  winGoPage5,
  winGoPage10,
  trxPage,
  trxPage3,
  trxPage5,
  trxPage10,
  betWinGo,
  listOrderOld,
  GetMyEmerdList,
  handlingWinGo1P,
  tradeCommission,
  tradeCommissionadmin,
  tradeCommissionGet,
  addWinGo_30, // 30 seconds version
  addWinGo_1, // 1 minute version (kept for compatibility)
  addWinGo_3,
  addWinGo_5,
  addWinGo_11,
};
