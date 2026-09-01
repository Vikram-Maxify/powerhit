const express = require("express");
const {
  createRound,
  getCurrentRound,
  completeRound,
  placeTrade,
  getMyActiveTrade,
} = require("../controllers/tradingController");

const router = express.Router();

router.post("/round/create", createRound);
router.get("/round/current", getCurrentRound);
router.post("/round/complete", completeRound);

router.post("/trade/place", placeTrade);
router.get("/trade/active", getMyActiveTrade);

module.exports = router;
