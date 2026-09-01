const express = require("express");
const {
  createRound,
  getCurrentRound,
  completeRound,
  placeTrade,
  getMyActiveTrade,
} = require("../controllers/tradingController");

const { protect, } = require("../middleware/authMiddleware.js");


const router = express.Router();

router.post("/round/create", protect, createRound);
router.get("/round/current", protect, getCurrentRound);
router.post("/round/complete", protect, completeRound);

router.post("/trade/place", protect, placeTrade);
router.get("/trade/active", protect, getMyActiveTrade);

module.exports = router;
