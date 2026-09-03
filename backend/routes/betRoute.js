// Bet pages
app.get("/bet/wingo", betController.winGoPage);

app.get("/bet/wingo10", betController.winGoPage10);

app.get("/bet/trx", betController.trxPage);

// API routes
app.post("/api/bet", protect, betController.betWinGo);

app.post("/api/order-list", betController.listOrderOld);

app.post("/api/my-bets", betController.GetMyEmerdList);

app.post("/api/commission-admin", betController.tradeCommissionadmin);

app.get("/api/commission-get", betController.tradeCommissionGet);
